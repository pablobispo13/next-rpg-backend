import { NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";
import { authenticate, AuthenticatedRequest } from "../../../lib/auth";
import { notifyClients } from "../stream";

const prisma = new PrismaClient();

async function handler(req: AuthenticatedRequest, res: NextApiResponse): Promise<any> { // eslint-disable-line @typescript-eslint/no-explicit-any 
  const user = req.user!;

  if (req.method === "GET") {
    try {
      const chars = await prisma.character.findMany({ include: { owner: true } });
      return res.status(200).json({ characters: chars });
    } catch (err) {
      console.error("Erro no GET /characters:", err);
      return res.status(500).json({ message: "Erro ao buscar personagens" });
    }
  }

  if (req.method === "POST") {
    try {
      if (user.role !== "MESTRE") {
        const existing = await prisma.character.findFirst({ include: { owner: true }, where: { ownerId: user.userId } });
        if (existing) return res.status(400).json({ message: "Você já possui um personagem" });
      }

      const data: any = {// eslint-disable-line @typescript-eslint/no-explicit-any 
        name: req.body.name ?? "Novo Personagem",
        life: req.body.life ?? 100,
        xp: req.body.xp ?? 0,
        agility: req.body.agility ?? 10,
        strength: req.body.strength ?? 10,
        vigor: req.body.vigor ?? 10,
        presence: req.body.presence ?? 10,
        intellect: req.body.intellect ?? 10,
        ownerId: user.userId,
      };
      if (req.body.passiveSkillId) data.passiveSkillId = req.body.passiveSkillId;

      const char = await prisma.character.create({ data });

      await notifyClients();
      return res.status(201).json(char);
    } catch (err) {
      console.error("Erro no POST /characters:", err);
      return res.status(500).json({ message: "Erro ao criar personagem" });
    }
  }

  return res.status(405).end();
}

export default authenticate(handler);
