// pages/api/roll.ts
import type { NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { authenticate, AuthenticatedRequest } from "../../lib/auth";
import { rollDice } from "../../lib/dice";
import { notifyClients } from "../../lib/sse";
import { LogType } from "@prisma/client";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.status(405).end();
        return;
    }

    const user = req.user!;
    const { characterId, actionPresetId, targetIds = [], combatId, turnId } = req.body;

    if (!characterId || !actionPresetId) {
        return res.status(400).json({ message: "Dados inválidos" });
    }

    const character = await prisma.character.findUnique({ where: { id: characterId } });
    if (!character) return res.status(404).json({ message: "Personagem não encontrado" });
    if (user.role !== "MESTRE" && character.ownerId !== user.userId)
        return res.status(403).json({ message: "Acesso negado" });

    const preset = await prisma.actionPreset.findUnique({ where: { id: actionPresetId } });
    if (!preset) return res.status(404).json({ message: "Preset inválido" });

    const diceResult = rollDice(preset.diceFormula);
    const attributeBonus = (character as any)[preset.attribute] ?? 0;
    const modifier = preset.modifier ?? 0;
    const total = diceResult.total + attributeBonus + modifier;

    const isCritical = diceResult.rolls.some(r => r >= (preset.critThreshold ?? 999));

    // Cria roll
    const roll = await prisma.rollResult.create({
        data: {
            characterId: character.id,
            presetId: preset.id,
            combatId: combatId ?? null,
            turnId: turnId ?? null,
            targetIds,
            diceRolled: preset.diceFormula,
            rolls: diceResult.rolls,
            modifier: attributeBonus + modifier,
            total,
            critical: isCritical,
            damage: preset.type === "ATTACK" ? total : null,
            healing: preset.type === "HEAL" ? total : null,
            pendingReaction: preset.appliesEffect,
            reacted: false,
        },
    });

    // Aplica efeito a cada alvo
    for (const targetId of targetIds) {
        const target = await prisma.character.findUnique({ where: { id: targetId } });
        if (!target) continue;

        // valida permissão
        if (user.role !== "MESTRE" && target.ownerId !== user.userId) continue;

        let newLife = target.life;

        if (preset.type === "ATTACK") {
            newLife = Math.max(target.life - total, 0);
            await prisma.character.update({ where: { id: target.id }, data: { life: newLife } });

            await prisma.actionLog.create({
                data: {
                    type: LogType.DAMAGE,
                    message: `${target.name} sofreu ${total} de dano de ${preset.name}`,
                    characterId: character.id,
                    targetId,
                    rollId: roll.id,
                    combatId: combatId ?? null,
                    turnId: turnId ?? null,
                },
            });
        }

        if (preset.type === "HEAL") {
            newLife = Math.min(target.life + total, target.maxLife);
            await prisma.character.update({ where: { id: target.id }, data: { life: newLife } });

            await prisma.actionLog.create({
                data: {
                    type: LogType.HEAL,
                    message: `${target.name} recebeu ${total} de cura de ${preset.name}`,
                    characterId: character.id,
                    targetId,
                    rollId: roll.id,
                    combatId: combatId ?? null,
                    turnId: turnId ?? null,
                },
            });
        }

        // Aplica efeito contínuo (DOT/HoT)
        if (preset.appliesEffect) {
            let effectType: "DAMAGE_OVER_TIME" | "HEAL_OVER_TIME" | null = null;

            if (preset.type === "ATTACK" && preset.statusApplied) effectType = "DAMAGE_OVER_TIME";
            if (preset.type === "HEAL") effectType = "HEAL_OVER_TIME";

            if (effectType) {
                await prisma.characterEffect.create({
                    data: {
                        characterId: target.id,
                        presetId: preset.id,
                        type: effectType,
                        value: preset.effectAmount ?? total,
                        remainingTurns: preset.durationTurns ?? 3,
                        appliedAt: new Date(),
                    },
                });

                await prisma.actionLog.create({
                    data: {
                        type: LogType.MANUAL_OVERRIDE,
                        message: `${target.name} recebeu efeito ${preset.name} (${effectType}) por ${preset.durationTurns ?? 3} turnos`,
                        characterId: character.id,
                        targetId,
                        rollId: roll.id,
                        combatId: combatId ?? null,
                        turnId: turnId ?? null,
                    },
                });
            }
        }
    }

    // Log da ação do usuário
    await prisma.actionLog.create({
        data: {
            type: LogType.ROLL,
            message: `${character.name} usou ${preset.name}`,
            characterId: character.id,
            rollId: roll.id,
            combatId: combatId ?? null,
            turnId: turnId ?? null,
        },
    });

    await notifyClients();

    res.status(201).json({ roll, pendingReaction: preset.appliesEffect, total, dice: diceResult.rolls });
}

export default authenticate(handler);
