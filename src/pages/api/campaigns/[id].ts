import type { NextApiResponse } from "next";
import { authenticate, AuthenticatedRequest } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { getCampaignAccess } from "../../../lib/campaignAccess";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const user = req.user!;
  const { id } = req.query;
  if (typeof id !== "string") {
    res.status(400).json({ message: "ID inválido" });
    return;
  }

  // GET e PATCH permitem ver/editar mesa arquivada (mestre precisa pra restaurar)
  const access = await getCampaignAccess(user, id, { allowArchived: true });
  if (!access) {
    res.status(404).json({ message: "Mesa não encontrada" });
    return;
  }

  // DETALHES
  if (req.method === "GET") {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: {
        master: { select: { id: true, username: true } },
        members: {
          include: { user: { select: { id: true, username: true, role: true } } },
        },
        invites: { where: { active: true } },
        _count: { select: { characters: true, combats: true } },
      },
    });
    res.status(200).json(campaign);
    return;
  }

  // EDITAR / ARQUIVAR (apenas mestre dono)
  if (req.method === "PATCH") {
    if (!access.isMaster) {
      res.status(403).json({ message: "Apenas o mestre da mesa pode editar" });
      return;
    }

    const { name, description, image, archived } = req.body ?? {};
    const data: Record<string, unknown> = {};
    if (typeof name === "string" && name.trim()) data.name = name.trim();
    if (typeof description === "string") data.description = description;
    if (typeof image === "string") data.image = image;
    if (archived === true) data.archivedAt = new Date();
    if (archived === false) data.archivedAt = null;

    const campaign = await prisma.campaign.update({ where: { id }, data });
    res.status(200).json(campaign);
    return;
  }

  res.status(405).end();
}

export default authenticate(handler);
