import type { NextApiResponse } from "next";
import { authenticate, AuthenticatedRequest } from "../../../../lib/auth";
import { prisma } from "../../../../lib/prisma";
import { getCampaignAccess, generateInviteCode } from "../../../../lib/campaignAccess";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const user = req.user!;
  const { id } = req.query;
  if (typeof id !== "string") {
    res.status(400).json({ message: "ID inválido" });
    return;
  }

  const access = await getCampaignAccess(user, id);
  if (!access || !access.isMaster) {
    res.status(403).json({ message: "Apenas o mestre pode gerar convites" });
    return;
  }

  if (req.method === "POST") {
    const { expiresInHours, maxUses } = req.body ?? {};

    // Tenta até 5 vezes em caso de colisão de código
    let invite = null;
    for (let attempt = 0; attempt < 5 && !invite; attempt++) {
      try {
        invite = await prisma.campaignInvite.create({
          data: {
            campaignId: id,
            code: generateInviteCode(6),
            expiresAt:
              typeof expiresInHours === "number"
                ? new Date(Date.now() + expiresInHours * 3600_000)
                : null,
            maxUses: typeof maxUses === "number" ? maxUses : null,
          },
        });
      } catch {
        // colisão de unique code — tenta de novo
      }
    }

    if (!invite) {
      res.status(500).json({ message: "Falha ao gerar código único" });
      return;
    }

    res.status(201).json(invite);
    return;
  }

  // DESATIVAR convite (PATCH com inviteId)
  if (req.method === "PATCH") {
    const { inviteId, active } = req.body ?? {};
    if (typeof inviteId !== "string") {
      res.status(400).json({ message: "inviteId obrigatório" });
      return;
    }
    const invite = await prisma.campaignInvite.update({
      where: { id: inviteId },
      data: { active: !!active },
    });
    res.status(200).json(invite);
    return;
  }

  res.status(405).end();
}

export default authenticate(handler);
