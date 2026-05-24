import type { NextApiResponse } from "next";
import { authenticate, AuthenticatedRequest } from "../../lib/auth";
import { prisma } from "../../lib/prisma";
import { notifyStreamUpdate } from "../../lib/pusher";
import { getCampaignAccess } from "../../lib/campaignAccess";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    const user = req.user!;

    const headerId = req.headers["x-campaign-id"];
    const queryId = req.query.campaignId;
    const campaignId =
        (typeof headerId === "string" && headerId) ||
        (typeof queryId === "string" && queryId) ||
        null;

    if (!campaignId) {
        return res.status(400).json({ message: "Mesa ativa obrigatória" });
    }

    const access = await getCampaignAccess(user, campaignId);
    if (!access) return res.status(403).json({ message: "Sem acesso a esta mesa" });

    // GET — retorna a streamUrl da mesa
    if (req.method === "GET") {
        const campaign = await prisma.campaign.findUnique({
            where: { id: campaignId },
            select: { streamUrl: true },
        });
        return res.status(200).json({ streamUrl: campaign?.streamUrl ?? null });
    }

    // POST — mestre da mesa atualiza streamUrl
    if (req.method === "POST") {
        if (!access.isMaster) {
            return res.status(403).json({ message: "Apenas o mestre da mesa pode configurar a stream" });
        }
        const { streamUrl } = req.body;
        await prisma.campaign.update({
            where: { id: campaignId },
            data: { streamUrl: streamUrl || null },
        });
        notifyStreamUpdate(campaignId);
        return res.status(200).json({ message: "Stream atualizada" });
    }

    res.status(405).end();
}

export default authenticate(handler);
