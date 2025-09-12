import { NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { authenticate, AuthenticatedRequest } from "../../../lib/auth";
import { notifyClients } from "../stream";

const prisma = new PrismaClient();

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any 
  const { id } = req.query;
  const user = req.user!;

  const character = await prisma.character.findUnique({ where: { id: id as string } });
  if (!character) return res.status(404).json({ message: "Personagem não encontrado" });

  if (user.role !== "MESTRE" && character.ownerId !== user.userId)
    return res.status(403).json({ message: "Acesso negado" });

  if (req.method === "PUT") {
    const updated = await prisma.character.update({
      where: { id: id as string },
      data: {
        name: req.body.name,
        life: req.body.life,
        xp: req.body.xp,
        agility: req.body.agility,
        strength: req.body.strength,
        vigor: req.body.vigor,
        presence: req.body.presence,
        intellect: req.body.intellect,
      },
    });

    await notifyClients();
    return res.status(200).json(updated);
  }

  return res.status(405).end();
}

export default authenticate(handler);
