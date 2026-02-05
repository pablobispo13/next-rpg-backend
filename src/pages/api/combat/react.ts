import type { NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { authenticate, AuthenticatedRequest } from "../../../lib/auth";
import { rollDice } from "../../../lib/dice";
import { LogType } from "@prisma/client";
import { getAttributeValue } from "../../../lib/attributes";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.status(405).end();
        return;
    }

    const user = req.user!;
    const { rollId, reactionType, characterId, turnId } = req.body;

    if (!rollId || !reactionType || !characterId)
        return res.status(400).json({ message: "Dados obrigatórios ausentes" });

    if (turnId) {
        const turn = await prisma.combatTurn.findUnique({
            where: { id: turnId },
        });
        if (!turn)
            return res.status(400).json({ message: "turnId inválido" });
    }

    const attackRoll = await prisma.rollResult.findUnique({
        where: { id: rollId },
        include: { preset: true },
    });

    if (!attackRoll || !attackRoll.pendingReaction || attackRoll.reacted)
        return res.status(400).json({ message: "Reação inválida" });

    const target = await prisma.character.findUnique({
        where: { id: characterId },
    });
    if (!target)
        return res.status(404).json({ message: "Alvo não encontrado" });

    if (user.role !== "MESTRE" && target.ownerId !== user.userId)
        return res.status(403).json({ message: "Não é seu personagem" });

    const attacker = await prisma.character.findUnique({
        where: { id: attackRoll.characterId },
    });
    if (!attacker)
        return res.status(404).json({ message: "Atacante não encontrado" });

    const damage = attackRoll.damage ?? 0;

    let success = false;
    let reactionTotal = 0;
    let reactionPresetId: string;
    let reactionModifier = 0;

    /* =========================
       DEFINE PRESET DA REAÇÃO
    ========================= */
    if (reactionType === "DODGE") {
        if (!target.dodgePresetId)
            return res.status(400).json({ message: "Esquiva não configurada" });

        reactionPresetId = target.dodgePresetId;
    }
    else if (reactionType === "BLOCK") {
        if (!target.blockPresetId)
            return res.status(400).json({ message: "Bloqueio não configurado" });

        reactionPresetId = target.blockPresetId;
    }
    else if (reactionType === "COUNTER_ATTACK") {
        if (!target.counterAttackPresetId)
            return res.status(400).json({ message: "Contra-ataque não configurado" });

        reactionPresetId = target.counterAttackPresetId;
    }
    else {
        return res.status(400).json({ message: "Reação inválida" });
    }

    const preset = await prisma.actionPreset.findUnique({
        where: { id: reactionPresetId },
    });
    if (!preset)
        return res.status(404).json({ message: "Preset inválido" });

    /* =========================
       ROLL DA REAÇÃO
    ========================= */
    const reactionRollData: ReturnType<typeof rollDice> = rollDice(preset.diceFormula);

    const attributeValue = getAttributeValue(target, preset.attribute);
    reactionModifier = attributeValue + (preset.modifier ?? 0);
    reactionTotal = reactionRollData.total + reactionModifier;

    /* =========================
       RESOLVE EFEITOS
    ========================= */
    if (reactionType === "COUNTER_ATTACK") {
        success = true;

        await prisma.character.update({
            where: { id: attacker.id },
            data: {
                life: Math.max(attacker.life - reactionTotal, 0),
            },
        });
    } else {
        success = reactionTotal >= attackRoll.total;

        if (!success) {
            await prisma.character.update({
                where: { id: target.id },
                data: {
                    life: Math.max(target.life - damage, 0),
                },
            });
        }
    }

    /* =========================
       SALVA ROLL DA REAÇÃO
    ========================= */
    const reactionRoll = await prisma.rollResult.create({
        data: {
            characterId: target.id,
            presetId: preset.id,
            combatId: attackRoll.combatId,
            turnId,
            targetIds: [attacker.id],

            diceRolled: preset.diceFormula,
            rolls: reactionRollData.rolls,
            modifier: reactionModifier,
            total: reactionTotal,

            success,
            critical: false,
        },
    });

    /* =========================
       FINALIZA ROLL DE ATAQUE
    ========================= */
    await prisma.rollResult.update({
        where: { id: attackRoll.id },
        data: {
            reacted: true,
            pendingReaction: false,
            reactionType,
            success,
        },
    });

    /* =========================
       LOG
    ========================= */
    const logMessage =
        `${target.name} tentou ${reactionType} ` +
        `(${reactionTotal} vs ${attackRoll.total}) → ` +
        `${success ? "SUCESSO" : "FALHOU"}`;

    await prisma.actionLog.create({
        data: {
            type: LogType.REACTION,
            message: logMessage,
            characterId: target.id,
            targetId: attacker.id,
            rollId: reactionRoll.id,
            combatId: attackRoll.combatId,
            turnId,
        },
    });
    return res.status(200).json({ success });
}

export default authenticate(handler);
