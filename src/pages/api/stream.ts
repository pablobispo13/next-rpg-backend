import type { NextApiResponse } from "next";
import { authenticate, AuthenticatedRequest } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    const user = req.user!;

    // GET — retorna a streamUrl do mestre ativo
    if (req.method === "GET") {
        // Mestre retorna a própria; jogador retorna a do primeiro mestre com stream ativa
        if (user.role === "MESTRE") {
            const me = await prisma.user.findUnique({ where: { id: user.userId }, select: { streamUrl: true } });
            return res.status(200).json({ streamUrl: me?.streamUrl ?? null });
        }

        const mestre = await prisma.user.findFirst({
            where: { role: "MESTRE", streamUrl: { not: null } },
            select: { streamUrl: true },
        });
        return res.status(200).json({ streamUrl: mestre?.streamUrl ?? null });
    }

    // POST — mestre atualiza a própria streamUrl
    if (req.method === "POST") {
        if (user.role !== "MESTRE") {
            return res.status(403).json({ message: "Apenas o mestre pode configurar a stream" });
        }
        const { streamUrl } = req.body;
        await prisma.user.update({
            where: { id: user.userId },
            data: { streamUrl: streamUrl || null },
        });
        return res.status(200).json({ message: "Stream atualizada" });
    }

    res.status(405).end();
}

export default authenticate(handler);
