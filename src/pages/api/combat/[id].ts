import type { NextApiResponse } from "next";
import { authenticate, AuthenticatedRequest } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { RollResult } from "@prisma/client";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (req.method !== "GET") {
        res.status(405).end();
        return;
    }

    if (!id || typeof id !== "string") {
        return res.status(400).json({ message: "id inválido" });
    }

    const combat = await prisma.combat.findUnique({
        where: { id: id, active: true },
        include: {
            participants: {
                include: {
                    character: {
                        include: {
                            presets: true,
                            statusEffects: true,
                        },
                    },
                },
            },
            turns: true,
            logs: { include: { roll: { include: { character: true, preset: true } }, character: true, target: true } },
            rollResults: {
                include: { character: true },
            },
        },
    });

    if (!combat) {
        return res.status(404).json({ message: "Combate não encontrado" });
    }

    const rollResultsWithTargets = combat.rollResults.map((roll: RollResult) => {
        const targets = roll.targetIds.map((tid: string) => {
            return combat.participants.find((p: any) => p.character.id === tid)?.character || null;/* eslint-disable  @typescript-eslint/no-explicit-any */
        });
        return {
            ...roll,
            targets,
        };
    });

    return res.status(200).json({
        ...combat,
        rollResults: rollResultsWithTargets,
    });
}

export default authenticate(handler);
