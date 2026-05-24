import type { NextApiResponse } from "next";
import { authenticate, AuthenticatedRequest } from "../../../../../lib/auth";
import { prisma } from "../../../../../lib/prisma";
import { getCampaignAccess } from "../../../../../lib/campaignAccess";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    res.status(405).end();
    return;
  }

  const user = req.user!;
  const { id, userId } = req.query;
  if (typeof id !== "string" || typeof userId !== "string") {
    res.status(400).json({ message: "Parâmetros inválidos" });
    return;
  }

  const access = await getCampaignAccess(user, id);
  if (!access) {
    res.status(404).json({ message: "Mesa não encontrada" });
    return;
  }

  // Mestre pode remover qualquer um; jogador só pode sair de si mesmo
  if (!access.isMaster && userId !== user.userId) {
    res.status(403).json({ message: "Sem permissão" });
    return;
  }

  // Não permite remover o próprio mestre da mesa
  const campaign = await prisma.campaign.findUnique({
    where: { id },
    select: { masterId: true },
  });
  if (campaign?.masterId === userId) {
    res.status(400).json({ message: "Não é possível remover o mestre da mesa" });
    return;
  }

  await prisma.campaignMember.deleteMany({
    where: { campaignId: id, userId },
  });

  res.status(204).end();
}

export default authenticate(handler);
