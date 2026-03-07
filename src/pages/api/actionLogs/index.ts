import { NextApiResponse } from "next";
import { authenticate, AuthenticatedRequest } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";


async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    const user = req.user!;

    // LISTAR ACTIONLOGS
    if (req.method === "GET") {
        const { characterId } = req.query;

        if (typeof characterId !== "string") {
            res.status(400).json({ message: "characterId é obrigatório" });
            return;
        }

        const actionLogs = await prisma.actionLog.findMany({
            where: { characterId },
            take: 10,
            orderBy: { createdAt: "desc" },
            include: {
                roll: { include: { preset: true } },
                character: true, target: true
            }
        });

        res.status(200).json({ actionLogs });
        return;
    }

    if (req.method !== "POST") {
        res.status(405).end();
        return;
    }

    res.status(405).end();
}

export default authenticate(handler);
