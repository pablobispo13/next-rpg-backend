import { NextApiResponse } from "next";
import { authenticate, AuthenticatedRequest } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { notifyClients } from "../../../lib/sse";

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
      presets: {
        include: {
          characterEffects: true,
          dodgeCharacters: true,
          counterAttackCharacters: true,
          rolls: true,
          inventories: true,
        },
      },
      inventory: true,
      dodgePreset: true,
      counterAttackPreset: true,
      actionLogs: true,
      targetLogs: true,
      combatParticipants: true,
      turns: true,
      rollResults: true,
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
      dodgePresetId,
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
        dodgePresetId,
        counterAttackPresetId,
      },
      include: {
        owner: true,
        presets: {
          include: {
            characterEffects: true,
            dodgeCharacters: true,
            counterAttackCharacters: true,
            rolls: true,
            inventories: true,
          },
        },
        inventory: true,
        dodgePreset: true,
        counterAttackPreset: true,
        actionLogs: true,
        targetLogs: true,
        combatParticipants: true,
        turns: true,
        rollResults: true,
        statusEffects: true,
      },
    });

    await notifyClients();
    res.status(200).json(updated);
    return;
  }

  res.status(405).end();
}

export default authenticate(handler);
