import type { NextApiResponse } from "next";
import { authenticate, AuthenticatedRequest } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { RollResult } from "@prisma/client";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    const { id } = req.query;
    const user = req.user!;

    if (!id || typeof id !== "string") {
        res.status(400).json({ message: "id inválido" });
        return;
    }

    if (req.method === "GET") {
        const combat = await prisma.combat.findUnique({
            where: { id },
            include: {
                participants: {
                    include: {
                        character: {
                            include: {
                                presets: true,
                                statusEffects: true,
                                owner: { select: { role: true } },
                            },
                        },
                    },
                },
                turns: true,
                logs: { include: { roll: { select: { id: true, diceRolled: true, rolls: true, modifier: true, total: true, impactRolls: true, success: true, critical: true, damage: true, healing: true, pendingReaction: true, reacted: true } }, character: true, target: true } },
                rollResults: {
                    include: { character: true },
                },
            },
        });

        if (!combat) {
            res.status(404).json({ message: "Combate não encontrado" });
            return;
        }

        const rollResultsWithTargets = combat.rollResults.map((roll: RollResult) => {
            const targets = roll.targetIds.map((tid: string) => {
                return combat.participants.find((p: any) => p.character.id === tid)?.character || null;/* eslint-disable  @typescript-eslint/no-explicit-any */
            });
            return { ...roll, targets };
        });

        res.status(200).json({ ...combat, rollResults: rollResultsWithTargets });
        return;
    }

    if (req.method === "DELETE") {
        if (user.role !== "MESTRE") {
            res.status(403).json({ message: "Apenas o mestre pode deletar combates" });
            return;
        }

        const combat = await prisma.combat.findUnique({ where: { id } });
        if (!combat) {
            res.status(404).json({ message: "Combate não encontrado" });
            return;
        }

        const rollResultIds = (
            await prisma.rollResult.findMany({ where: { combatId: id }, select: { id: true } })
        ).map((r) => r.id);

        await prisma.rollResultDetail.deleteMany({ where: { rollResultId: { in: rollResultIds } } });
        await prisma.actionLog.deleteMany({ where: { combatId: id } });
        await prisma.rollResult.deleteMany({ where: { combatId: id } });
        await prisma.combatTurn.deleteMany({ where: { combatId: id } });
        await prisma.combatParticipant.deleteMany({ where: { combatId: id } });
        await prisma.combat.delete({ where: { id } });

        res.status(200).json({ message: "Combate deletado com sucesso" });
        return;
    }

    res.status(405).end();
}

export default authenticate(handler);
