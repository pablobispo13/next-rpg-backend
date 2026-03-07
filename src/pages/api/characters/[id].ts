import { NextApiResponse } from "next";
import { authenticate, AuthenticatedRequest } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";


async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const { id } = req.query;
  const user = req.user!;

  if (typeof id !== "string") {
    res.status(400).json({ message: "ID inválido" });
    return;
  }

  const character = await prisma.character.findUnique({
    where: { id },
    include: {
      owner: true,
      dodgePreset: true,
      blockPreset: true,
      counterAttackPreset: true,
      targetLogs: true,
      combatParticipants: true,
      turns: true,
      statusEffects: true,
    },
  });

  if (!character) {
    res.status(404).json({ message: "Personagem não encontrado" });
    return;
  }

  if (user.role !== "MESTRE" && character.ownerId !== user.userId) {
    res.status(403).json({ message: "Acesso negado" });
    return;
  }

  // DETALHE
  if (req.method === "GET") {
    res.status(200).json(character);
    return;
  }

  // ATUALIZAÇÃO
  if (req.method === "PUT") {
    const {
      name,
      life,
      maxLife,
      xp,
      strength,
      agility,
      vigor,
      intellect,
      presence,
      baseDefense,
      history,
      dodgePresetId,
      blockPresetId,
      counterAttackPresetId,
    } = req.body;

    const updated = await prisma.character.update({
      where: { id },
      data: {
        name,
        life,
        maxLife,
        xp,
        strength,
        agility,
        vigor,
        intellect,
        presence,
        baseDefense,
        history,
        dodgePresetId,
        blockPresetId,
        counterAttackPresetId,
      },
      include: {
        owner: true,
        dodgePreset: true,
        blockPreset: true,
        counterAttackPreset: true,
        targetLogs: true,
        combatParticipants: true,
        turns: true,
        rollResults: { include: { preset: true, logs: true, } },
        statusEffects: true,
      },
    });


    res.status(200).json(updated);
    return;
  }

  res.status(405).end();
}

export default authenticate(handler);
