import { NextApiResponse } from "next";
import { authenticate, AuthenticatedRequest } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { notifyClients } from "../../../lib/sse";

async function handler(
  req: AuthenticatedRequest,
  res: NextApiResponse
) {
  const { id } = req.query;
  const user = req.user!;

  if (typeof id !== "string") {
    res.status(400).json({ message: "ID inválido" });
    return;
  }

  const preset = await prisma.actionPreset.findUnique({
    where: { id },
    include: {
      character: true,
      characterEffects: true,
      dodgeCharacters: true,
      counterAttackCharacters: true,
      rolls: true,
      inventories: true,
    },
  });

  if (!preset) {
    res.status(404).json({ message: "Preset não encontrado" });
    return;
  }

  const character = preset.character;
  if (!character) {
    res.status(404).json({ message: "Personagem não encontrado" });
    return;
  }

  if (user.role !== "MESTRE" && character.ownerId !== user.userId) {
    res.status(403).json({ message: "Sem permissão" });
    return;
  }

  if (req.method === "DELETE") {
    await prisma.actionPreset.delete({ where: { id } });
    await notifyClients();
    res.status(204).end();
    return;
  }

  if (req.method === "GET") {
    res.status(200).json({ preset });
    return;
  }

  res.status(405).end();
}

export default authenticate(handler);
