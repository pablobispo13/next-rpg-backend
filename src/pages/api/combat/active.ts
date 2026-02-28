// pages/api/combat/active.ts
import type { NextApiResponse } from "next";
import { authenticate, AuthenticatedRequest } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        res.status(405).end();
        return;
    }

    const user = req.user;
    if (!user) {
        return res.status(401).json({ message: "Não autenticado" });
    }

    let combats;

    if (user.role === "MESTRE") {
        // Mestre vê todos os combates ativos
        combats = await prisma.combat.findMany({
            where: { active: true },
            include: {
                participants: {
                    include: {
                        character: true,
                    },
                },
            },
        });
    } else {
        // Jogador vê apenas combates onde ele possui personagens
        combats = await prisma.combat.findMany({
            where: {
                active: true,
                participants: {
                    some: {
                        character: {
                            ownerId: user.userId,
                        },
                    },
                },
            },
            include: {
                participants: {
                    include: {
                        character: true,
                    },
                },
            },
        });
    }

    return res.status(200).json(combats);
}

export default authenticate(handler);
