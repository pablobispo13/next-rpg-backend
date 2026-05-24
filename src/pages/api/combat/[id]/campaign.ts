import type { NextApiResponse } from "next";
import { authenticate, AuthenticatedRequest } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { getCampaignAccess } from "../../../../lib/campaignAccess";

/**
 * Endpoint utilitário: retorna o campaignId do combate, sem exigir header
 * x-campaign-id. Usado pelo front para fazer auto-troca de mesa via deep link.
 * Ainda valida que o usuário tem acesso à mesa.
 */
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    if (req.method !== "GET") {
        res.status(405).end();
        return;
    }

    const { id } = req.query;
    if (typeof id !== "string") {
        return res.status(400).json({ message: "ID inválido" });
    }

    const combat = await prisma.combat.findUnique({
        where: { id },
        select: { campaignId: true },
    });
    if (!combat) {
        return res.status(404).json({ message: "Combate não encontrado" });
    }

    const access = await getCampaignAccess(req.user!, combat.campaignId);
    if (!access) {
        return res.status(403).json({ message: "Sem acesso a esta mesa" });
    }

    return res.status(200).json({ campaignId: combat.campaignId });
}

export default authenticate(handler);
