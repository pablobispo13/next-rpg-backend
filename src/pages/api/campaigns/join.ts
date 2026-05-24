import type { NextApiResponse } from "next";
import { authenticate, AuthenticatedRequest } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.status(405).end();
    return;
  }

  const user = req.user!;
  const { code } = req.body ?? {};
  if (typeof code !== "string" || !code.trim()) {
    res.status(400).json({ message: "Código é obrigatório" });
    return;
  }

  const invite = await prisma.campaignInvite.findUnique({
    where: { code: code.trim().toUpperCase() },
    include: { campaign: { select: { id: true, archivedAt: true, name: true } } },
  });

  if (!invite || !invite.active) {
    res.status(404).json({ message: "Convite inválido" });
    return;
  }
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    res.status(410).json({ message: "Convite expirado" });
    return;
  }
  if (invite.maxUses != null && invite.uses >= invite.maxUses) {
    res.status(410).json({ message: "Convite esgotado" });
    return;
  }
  if (invite.campaign.archivedAt) {
    res.status(410).json({ message: "Mesa arquivada" });
    return;
  }

  // Já é membro?
  const existing = await prisma.campaignMember.findUnique({
    where: {
      campaignId_userId: { campaignId: invite.campaignId, userId: user.userId },
    },
  });

  if (!existing) {
    await prisma.campaignMember.create({
      data: { campaignId: invite.campaignId, userId: user.userId },
    });
    await prisma.campaignInvite.update({
      where: { id: invite.id },
      data: { uses: { increment: 1 } },
    });
  }

  res.status(200).json({
    campaignId: invite.campaignId,
    campaignName: invite.campaign.name,
    alreadyMember: !!existing,
  });
}

export default authenticate(handler);
