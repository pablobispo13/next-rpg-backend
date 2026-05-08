import type { NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { authenticate, AuthenticatedRequest } from "../../lib/auth";
import { rollDice } from "../../lib/dice";
import { LogType, EffectType, ActionType } from "@prisma/client";
import { getAttributeValue } from "../../lib/attributes";
import { notifyCombatUpdate } from "../../lib/pusher";

function joinNames(names: string[]): string {
    if (names.length === 1) return names[0];
    return names.slice(0, -1).join(", ") + " e " + names[names.length - 1];
}

function buildRollLog(charName: string, presetName: string, presetType: string, hitNames: string[], missNames: string[]): string {
    if (presetType !== ActionType.ATTACK) {
        return `${charName} usou ${presetName} em ${joinNames([...hitNames, ...missNames])}`;
    }
    if (hitNames.length === 0) {
        return `${charName} tentou ${presetName} em ${joinNames(missNames)}, mas falhou na defesa`;
    }
    if (missNames.length === 0) {
        return `${charName} acertou ${presetName} em ${joinNames(hitNames)}`;
    }
    return `${charName} usou ${presetName} — acertou: ${joinNames(hitNames)} | errou: ${joinNames(missNames)}`;
}

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {

    if (req.method === "GET") {
        const { combatId, characterId, limit = 20 } = req.query;

        try {
            const rolls = await prisma.rollResult.findMany({
                where: {
                    ...(combatId === "none"
                        ? { combatId: null }
                        : combatId
                            ? { combatId: String(combatId) }
                            : {}),
                    ...(characterId ? { characterId: String(characterId) } : {}),
                },
                include: {
                    character: {
                        select: { id: true, name: true },
                    },
                    preset: {
                        select: { id: true, name: true, type: true, impactFormula: true },
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

    const pendingReactionTargets: Array<{ targetId: string; status: "PENDING" }> = [];
    const hitNames:          string[] = [];
    const missNames:         string[] = [];
    const directDamageNames: string[] = [];
    const directHealNames:   string[] = [];

    // Dano é rolado UMA vez e aplicado a todos os alvos
    let impactTotal: number | null = null;
    let impactRolls: number[] = [];

    if (preset.impactFormula) {
        const impactRoll = rollDice(preset.impactFormula);
        impactRolls = impactRoll.rolls;
        impactTotal = impactRoll.total + effectiveAttribute;

        if (isCritical && preset.critMultiplier) {
            impactTotal = Math.floor(impactTotal * preset.critMultiplier);
        }
    }

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

        // Busca CombatParticipant para aplicar dano/cura
        let combatParticipant = null;
        let beforeLife = target.life;

        if (combatId) {
            combatParticipant = await prisma.combatParticipant.findFirst({
                where: {
                    combatId,
                    characterId: targetId,
                },
            });

            if (combatParticipant) {
                beforeLife = combatParticipant.currentLife;
            }
        }

        if (!passedBaseDefense) {

            await prisma.rollResultDetail.create({
                data: {
                    rollResultId: roll.id,
                    targetId,
                    beforeLife,
                    succeeded: false,
                    critical: false,
                    targetDefense: target.baseDefense ?? 0,
                },
            });

            missNames.push(target.name);
            continue;
        }

        const shouldOpenReaction =
            preset.type === ActionType.ATTACK &&
            !!(
                target.dodgePresetId ||
                target.blockPresetId ||
                target.counterAttackPresetId
            );

        // Aplica dano/cura automático em combate
        let afterLife = beforeLife;

        const isHealType = preset.type === ActionType.HEAL || preset.type === ActionType.SUPPORT;

        if (impactTotal) {
            if (combatParticipant) {
                // Em combate: atualiza HP do participante
                if (preset.type === ActionType.ATTACK && !shouldOpenReaction) {
                    afterLife = Math.max(0, beforeLife - impactTotal);
                    await prisma.combatParticipant.update({
                        where: { id: combatParticipant.id },
                        data: { currentLife: afterLife },
                    });
                } else if (isHealType) {
                    afterLife = Math.min(target.maxLife, beforeLife + impactTotal);
                    await prisma.combatParticipant.update({
                        where: { id: combatParticipant.id },
                        data: { currentLife: afterLife },
                    });
                }
            } else {
                // Fora de combate: atualiza diretamente character.life
                if (preset.type === ActionType.ATTACK) {
                    afterLife = Math.max(0, target.life - impactTotal);
                    await prisma.character.update({
                        where: { id: targetId },
                        data: { life: afterLife },
                    });
                } else if (isHealType) {
                    afterLife = Math.min(target.maxLife, target.life + impactTotal);
                    await prisma.character.update({
                        where: { id: targetId },
                        data: { life: afterLife },
                    });
                }
            }
        }

        // Cria RollResultDetail para sucesso
        await prisma.rollResultDetail.create({
            data: {
                rollResultId: roll.id,
                targetId,
                beforeLife,
                succeeded: true,
                critical: isCritical,
                damageApplied:
                    preset.type === ActionType.ATTACK ? impactTotal : null,
                healingApplied:
                    isHealType ? impactTotal : null,
                targetDefense: target.baseDefense ?? 0,
            },
        });

        if (shouldOpenReaction) {
            pendingReactionTargets.push({ targetId, status: "PENDING" });
        }

        await prisma.rollResult.update({
            where: { id: roll.id },
            data: {
                success: true,
                pendingReaction: shouldOpenReaction,
                impactRolls: impactRolls.length > 0 ? impactRolls : undefined,
                damage:
                    preset.type === ActionType.ATTACK
                        ? impactTotal
                        : null,
                healing:
                    isHealType
                        ? impactTotal
                        : null,
            },
        });

        hitNames.push(target.name);
        if (impactTotal && impactTotal > 0 && !shouldOpenReaction) {
            if (preset.type === ActionType.ATTACK) directDamageNames.push(target.name);
            else if (isHealType) directHealNames.push(target.name);
        }

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

    // Corrige success para o caso de todos errarem (nenhum hit path rodou)
    if (hitNames.length === 0 && missNames.length > 0) {
        await prisma.rollResult.update({ where: { id: roll.id }, data: { success: false } });
    }

    // Log único de ataque/ação consolidando todos os alvos
    await prisma.actionLog.create({
        data: {
            type: LogType.ROLL,
            message: buildRollLog(character.name, preset.name, preset.type as string, hitNames, missNames),
            characterId: character.id,
            rollId: roll.id,
            combatId: combatId ?? null,
            turnId: turnId ?? null,
        },
    });

    // Log de dano direto (sem reação pendente)
    if (directDamageNames.length > 0 && impactTotal && impactTotal > 0) {
        await prisma.actionLog.create({
            data: {
                type: LogType.DAMAGE,
                message: directDamageNames.length === 1
                    ? `${directDamageNames[0]} recebeu ${impactTotal} de dano`
                    : `${joinNames(directDamageNames)} receberam ${impactTotal} de dano`,
                characterId: character.id,
                rollId: roll.id,
                combatId: combatId ?? null,
                turnId: turnId ?? null,
            },
        });
    }

    // Log de cura direta
    if (directHealNames.length > 0 && impactTotal && impactTotal > 0) {
        await prisma.actionLog.create({
            data: {
                type: LogType.HEAL,
                message: directHealNames.length === 1
                    ? `${directHealNames[0]} foi curado em ${impactTotal} por ${preset.name}`
                    : `${joinNames(directHealNames)} foram curados em ${impactTotal} por ${preset.name}`,
                characterId: character.id,
                rollId: roll.id,
                combatId: combatId ?? null,
                turnId: turnId ?? null,
            },
        });
    }

    // Atualiza roll com todos os alvos pendentes de reação
    if (pendingReactionTargets.length > 0) {
        await prisma.rollResult.update({
            where: { id: roll.id },
            data: {
                pendingReactionTargets: pendingReactionTargets as any,
            },
        });
    }

    if (combatId) notifyCombatUpdate(combatId); // fire-and-forget
    return res.status(201).json({ roll });
}

export default authenticate(handler);