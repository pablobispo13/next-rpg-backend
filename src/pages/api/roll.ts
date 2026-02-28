import type { NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { authenticate, AuthenticatedRequest } from "../../lib/auth";
import { rollDice } from "../../lib/dice";
import { LogType, EffectType, ActionType } from "@prisma/client";
import { getAttributeValue } from "../../lib/attributes";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.status(405).end();
        return;
    }

    const user = req.user!;
    const { characterId, actionPresetId, targetIds = [], combatId, turnId } = req.body;

    if (!characterId || !actionPresetId)
        return res.status(400).json({ message: "Dados inválidos" });

    if (turnId) {
        const turn = await prisma.combatTurn.findUnique({ where: { id: turnId } });
        if (!turn || (combatId && turn.combatId !== combatId)) {
            return res.status(400).json({ message: "turnId inválido ou não pertence ao combate" });
        }
    }

    const character = await prisma.character.findUnique({ where: { id: characterId } });
    if (!character) return res.status(404).json({ message: "Personagem não encontrado" });

    if (user.role !== "MESTRE" && character.ownerId !== user.userId)
        return res.status(403).json({ message: "Acesso negado" });

    const preset = await prisma.actionPreset.findUnique({ where: { id: actionPresetId } });
    if (!preset) return res.status(404).json({ message: "Preset inválido" });

    /* =========================
       ATRIBUTO + EFEITOS
    ========================= */

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

    /* =========================
       ROLAGEM
    ========================= */

    const attackRoll = rollDice(preset.diceFormula);
    const flatModifier = preset.modifier ?? 0;
    const attackTotal = attackRoll.total + effectiveAttribute + flatModifier;

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

    /* =========================
       RESOLUÇÃO POR ALVO
    ========================= */

    for (const targetId of resolvedTargetIds) {
        const target = await prisma.character.findUnique({ where: { id: targetId } });
        if (!target) continue;

        let passedBaseDefense = true;

        if (preset.type === ActionType.ATTACK) {
            passedBaseDefense = attackTotal >= (target.baseDefense ?? 0);
        }

        /* =========================
           FALHA NA DEFESA BASE
        ========================= */

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

        /* =========================
           SUCESSO / REAÇÃO
        ========================= */

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
                impactTotal = Math.floor(impactTotal * preset.critMultiplier);
            }
        }

        await prisma.rollResult.update({
            where: { id: roll.id },
            data: {
                success: true,
                pendingReaction: shouldOpenReaction,
                damage: preset.type === ActionType.ATTACK ? impactTotal : null,
                healing: preset.type === ActionType.HEAL ? impactTotal : null,
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

        /* =========================
           EFEITOS CONTÍNUOS
        ========================= */

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
