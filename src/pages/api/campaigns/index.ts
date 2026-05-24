import type { NextApiResponse } from "next";
import { authenticate, AuthenticatedRequest } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { campaignSchema } from "../../../validation/campaign";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const user = req.user!;

  // LISTAR mesas onde sou mestre OU membro
  if (req.method === "GET") {
    const includeArchived = req.query.includeArchived === "true";
    const campaigns = await prisma.campaign.findMany({
      where: {
        ...(includeArchived ? {} : { archivedAt: null }),
        OR: [
          { masterId: user.userId },
          { members: { some: { userId: user.userId } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        master: { select: { id: true, username: true } },
        members: {
          include: { user: { select: { id: true, username: true } } },
        },
        invites: {
          where: { active: true },
          orderBy: { createdAt: "desc" },
        },
        _count: { select: { characters: true, combats: true } },
      },
    });

    res.status(200).json({ campaigns });
    return;
  }

  // CRIAR mesa (apenas MESTRE)
  if (req.method === "POST") {
    if (user.role !== "MESTRE") {
      res.status(403).json({ message: "Apenas mestres podem criar mesas" });
      return;
    }

    let validated;
    try {
      validated = await campaignSchema.validate(req.body ?? {});
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Dados inválidos";
      res.status(400).json({ message: msg });
      return;
    }

    const campaign = await prisma.campaign.create({
      data: {
        name: validated.name,
        description: validated.description ?? null,
        image: req.body?.image ?? null,
        archivedAt: null,
        masterId: user.userId,
        members: {
          create: { userId: user.userId },
        },
      },
      include: {
        master: { select: { id: true, username: true } },
        members: {
          include: { user: { select: { id: true, username: true } } },
        },
      },
    });

    res.status(201).json(campaign);
    return;
  }

  res.status(405).end();
}

export default authenticate(handler);
