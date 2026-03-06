import type { NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { authenticate, AuthenticatedRequest } from "../../lib/auth";
import { rollDice } from "../../lib/dice";
import { LogType, EffectType, ActionType } from "@prisma/client";
import { getAttributeValue } from "../../lib/attributes";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {

    if (req.method === "GET") {
        const { combatId, characterId, limit = 20 } = req.query;

        try {
            const rolls = await prisma.rollResult.findMany({
                where: {
                    ...(combatId ? { combatId: String(combatId) } : {}),
                    ...(characterId ? { characterId: String(characterId) } : {}),
                },
                include: {
                    character: {
                        select: { id: true, name: true },
                    },
                    preset: {
                        select: { id: true, name: true, type: true },
                    },
                },
                orderBy: {
                    createdAt: "desc",
                },
                take: Number(limit),
            });

            return res.status(200).json({ rolls });

        } catch (err) {
            console.error("Erro ao buscar testes", err);
            return res.status(500).json({ message: "Erro interno" });
        }
    }

    if (req.method !== "POST") {
        res.status(405).end();
        return;
    }

    const user = req.user!;

    const {
        characterId,
        actionPresetId,
        diceFormula,
        logMessage,
        targetIds = [],
        combatId,
        turnId
    } = req.body;

    if (!characterId)
        return res.status(400).json({ message: "characterId obrigatório" });

    if (!actionPresetId && !diceFormula)
        return res.status(400).json({
            message: "Informe actionPresetId ou diceFormula"
        });

    if (turnId) {
        const turn = await prisma.combatTurn.findUnique({
            where: { id: turnId }
        });

        if (!turn || (combatId && turn.combatId !== combatId)) {
            return res.status(400).json({
                message: "turnId inválido ou não pertence ao combate"
            });
        }
    }

    const character = await prisma.character.findUnique({
        where: { id: characterId }
    });

    if (!character)
        return res.status(404).json({ message: "Personagem não encontrado" });

    if (user.role !== "MESTRE" && character.ownerId !== user.userId)
        return res.status(403).json({ message: "Acesso negado" });


    /* =====================================================
       ROLAGEM MANUAL (SEM PRESET)
    ===================================================== */

    if (diceFormula && !actionPresetId) {

        const dice = rollDice(diceFormula);

        const resolvedTargetIds =
            targetIds.length ? targetIds : [character.id];

        const roll = await prisma.rollResult.create({
            data: {
                characterId: character.id,
                presetId: null,
                combatId: combatId ?? null,
                turnId: turnId ?? null,
                targetIds: resolvedTargetIds,
                diceRolled: diceFormula,
                rolls: dice.rolls,
                modifier: 0,
                total: dice.total,
                critical: false,
                success: null,
                pendingReaction: false,
                reacted: false,
                reactionType: null,
            },
        });

        await prisma.actionLog.create({
            data: {
                type: LogType.ROLL,
                message:
                    logMessage ??
                    `${character.name} rolou ${diceFormula} (${dice.rolls.join(", ")}) = ${dice.total}`,
                characterId: character.id,
                rollId: roll.id,
                combatId: combatId ?? null,
                turnId: turnId ?? null,
            },
        });

        return res.status(201).json({ roll });
    }


    /* =====================================================
       ROLAGEM COM PRESET (SISTEMA ORIGINAL)
    ===================================================== */

    const preset = await prisma.actionPreset.findUnique({
        where: { id: actionPresetId }
    });

    if (!preset)
        return res.status(404).json({ message: "Preset inválido" });

    const baseAttribute = getAttributeValue(character, preset.attribute);

    const activeEffects = await prisma.characterEffect.findMany({
        where: {
            characterId: character.id,
            remainingTurns: { gt: 0 },
            statAffected: preset.attribute,
        },
    });

    const effectBonus = activeEffects.reduce((sum, e) => sum + e.value, 0);
    const effectiveAttribute = baseAttribute + effectBonus;


    const attackRoll = rollDice(preset.diceFormula);
    const flatModifier = preset.modifier ?? 0;

    const attackTotal =
        attackRoll.total + effectiveAttribute + flatModifier;

    const isCritical = attackRoll.rolls.some(
        r => r >= (preset.critThreshold ?? 999)
    );

    const resolvedTargetIds =
        preset.targetType === "SELF" || targetIds.length === 0
            ? [character.id]
            : targetIds;


    const roll = await prisma.rollResult.create({
        data: {
            characterId: character.id,
            presetId: preset.id,
            combatId: combatId ?? null,
            turnId: turnId ?? null,
            targetIds: resolvedTargetIds,
            diceRolled: preset.diceFormula,
            rolls: attackRoll.rolls,
            modifier: effectiveAttribute + flatModifier,
            total: attackTotal,
            critical: isCritical,
            success: null,
            pendingReaction: false,
            reacted: false,
            reactionType: null,
        },
    });


    /* =====================================================
       RESOLUÇÃO POR ALVO
    ===================================================== */

    for (const targetId of resolvedTargetIds) {

        const target = await prisma.character.findUnique({
            where: { id: targetId }
        });

        if (!target) continue;

        let passedBaseDefense = true;

        if (preset.type === ActionType.ATTACK) {
            passedBaseDefense =
                attackTotal >= (target.baseDefense ?? 0);
        }


        if (!passedBaseDefense) {

            await prisma.rollResult.update({
                where: { id: roll.id },
                data: { success: false },
            });

            await prisma.actionLog.create({
                data: {
                    type: LogType.ROLL,
                    message: `${character.name} tentou ${preset.name} em ${target.name}, mas falhou na defesa`,
                    characterId: character.id,
                    targetId,
                    rollId: roll.id,
                    combatId: combatId ?? null,
                    turnId: turnId ?? null,
                },
            });

            continue;
        }


        const shouldOpenReaction =
            preset.type === ActionType.ATTACK &&
            !!(
                target.dodgePresetId ||
                target.blockPresetId ||
                target.counterAttackPresetId
            );


        let impactTotal: number | null = null;

        if (preset.impactFormula) {

            const impactRoll = rollDice(preset.impactFormula);

            impactTotal = impactRoll.total + effectiveAttribute;

            if (isCritical && preset.critMultiplier) {
                impactTotal = Math.floor(
                    impactTotal * preset.critMultiplier
                );
            }
        }


        await prisma.rollResult.update({
            where: { id: roll.id },
            data: {
                success: true,
                pendingReaction: shouldOpenReaction,
                damage:
                    preset.type === ActionType.ATTACK
                        ? impactTotal
                        : null,
                healing:
                    preset.type === ActionType.HEAL
                        ? impactTotal
                        : null,
            },
        });


        await prisma.actionLog.create({
            data: {
                type: LogType.ROLL,
                message: shouldOpenReaction
                    ? `${character.name} acertou ${preset.name} em ${target.name}`
                    : `${character.name} usou ${preset.name} em ${target.name}`,
                characterId: character.id,
                targetId,
                rollId: roll.id,
                combatId: combatId ?? null,
                turnId: turnId ?? null,
            },
        });


        if (
            preset.appliesEffect &&
            preset.durationTurns &&
            preset.effectAmount
        ) {

            await prisma.characterEffect.create({
                data: {
                    characterId: target.id,
                    presetId: preset.id,
                    remainingTurns: preset.durationTurns,
                    type:
                        preset.type === ActionType.ATTACK
                            ? EffectType.DAMAGE_OVER_TIME
                            : EffectType.HEAL_OVER_TIME,
                    statAffected: preset.statAffected,
                    value: preset.effectAmount,
                },
            });

            await prisma.actionLog.create({
                data: {
                    type: LogType.MANUAL_OVERRIDE,
                    message: `${target.name} recebeu efeito ${preset.name} por ${preset.durationTurns} turnos`,
                    characterId: character.id,
                    targetId,
                    rollId: roll.id,
                    combatId: combatId ?? null,
                    turnId: turnId ?? null,
                },
            });
        }
    }

    return res.status(201).json({ roll });
}

export default authenticate(handler);