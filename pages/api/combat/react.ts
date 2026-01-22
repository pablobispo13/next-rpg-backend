// pages/api/combat/react.ts
import type { NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { authenticate, AuthenticatedRequest } from "../../../lib/auth";
import { rollDice } from "../../../lib/dice";
import { notifyClients } from "../../../lib/sse";
import { LogType } from "@prisma/client";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    const user = req.user!;

    if (req.method !== "POST") {
        res.status(405).end();
        return;
    }

    const { rollId, reactionType } = req.body;
    if (!rollId || !reactionType)
        return res.status(400).json({ message: "rollId e reactionType são obrigatórios" });

    const roll = await prisma.rollResult.findUnique({
        where: { id: rollId },
        include: {
            character: true,
            preset: true,
            combat: true,
        },
    });
    if (!roll) return res.status(404).json({ message: "Roll não encontrado" });

    const targetId = roll.targetIds[0];
    const target = await prisma.character.findUnique({
        where: { id: targetId },
        include: { statusEffects: true }
    });
    if (!target) return res.status(404).json({ message: "Alvo não encontrado" });

    if (user.role !== "MESTRE" && target.ownerId !== user.userId)
        return res.status(403).json({ message: "Não é seu personagem" });

    if (!roll.pendingReaction || roll.reacted)
        return res.status(400).json({ message: "Essa ação não pode mais ser reagida" });

    let success = false;
    let reactionDamage = 0;
    let updatedTargetLife = target.life;

    if (reactionType === "DODGE") {
        if (!target.dodgePresetId)
            return res.status(400).json({ message: "Preset de esquiva não configurado" });

        const dodgePreset = await prisma.actionPreset.findUnique({ where: { id: target.dodgePresetId } });
        if (!dodgePreset) return res.status(404).json({ message: "Preset de esquiva não encontrado" });

        const dodgeRoll = rollDice(dodgePreset.diceFormula);
        const dodgeTotal = dodgeRoll.total + (target as any)[dodgePreset.attribute] + (dodgePreset.modifier ?? 0);

        success = dodgeTotal >= roll.total;

        if (!success) {
            updatedTargetLife = Math.max(target.life - roll.total, 0);
            await prisma.character.update({ where: { id: target.id }, data: { life: updatedTargetLife } });
        }

        await prisma.actionLog.create({
            data: {
                type: LogType.MANUAL_OVERRIDE,
                message: `${target.name} tentou esquivar e ${success ? "conseguiu" : "falhou, recebendo dano de " + roll.total}`,
                characterId: target.id,
                targetId: roll.characterId,
                rollId: roll.id,
                combatId: roll.combatId,
            },
        });

    } else if (reactionType === "COUNTER_ATTACK") {
        if (!target.counterAttackPresetId)
            return res.status(400).json({ message: "Preset de contra-ataque não configurado" });

        const counterPreset = await prisma.actionPreset.findUnique({ where: { id: target.counterAttackPresetId } });
        if (!counterPreset) return res.status(404).json({ message: "Preset de contra-ataque não encontrado" });

        const counterRoll = rollDice(counterPreset.diceFormula);
        const counterTotal = counterRoll.total + (target as any)[counterPreset.attribute] + (counterPreset.modifier ?? 0);
        reactionDamage = counterTotal;

        const attacker = await prisma.character.findUnique({ where: { id: roll.characterId } });
        if (attacker) {
            const newLife = Math.max(attacker.life - reactionDamage, 0);
            await prisma.character.update({ where: { id: attacker.id }, data: { life: newLife } });

            await prisma.actionLog.create({
                data: {
                    type: LogType.DAMAGE,
                    message: `${target.name} contra-atacou ${attacker.name} causando ${reactionDamage} de dano`,
                    characterId: target.id,
                    targetId: attacker.id,
                    rollId: roll.id,
                    combatId: roll.combatId,
                },
            });

            // Aplica efeitos de status do preset, se houver
            if (counterPreset.appliesEffect) {
                await prisma.characterEffect.create({
                    data: {
                        characterId: attacker.id,
                        presetId: counterPreset.id,
                        remainingTurns: counterPreset.durationTurns ?? 1,
                        type: counterPreset.effectAmount ? "DAMAGE_OVER_TIME" : "HEAL_OVER_TIME",
                        value: counterPreset.effectAmount ?? 0,
                    },
                });
            }
        }

        success = true;
    } else {
        return res.status(400).json({ message: "Reação inválida" });
    }

    // Marca o roll como reagido
    const updatedRoll = await prisma.rollResult.update({
        where: { id: roll.id },
        data: { reacted: true, reactionType, success, pendingReaction: false },
        include: { character: true, preset: true, combat: true },
    });

    // Atualiza target completo
    const updatedTarget = await prisma.character.findUnique({
        where: { id: target.id },
        include: { statusEffects: true },
    });

    await notifyClients();

    res.status(200).json({
        roll: updatedRoll,
        reactionDamage,
        success,
        target: updatedTarget,
    });
}

export default authenticate(handler);
