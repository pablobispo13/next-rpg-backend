import { NextApiResponse } from "next";
import { authenticate, AuthenticatedRequest } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { notifyClients } from "../../../lib/sse";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const user = req.user!;

  // LISTAR PERSONAGENS
  if (req.method === "GET") {
    const characters =
      user.role === "MESTRE"
        ? await prisma.character.findMany({
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
        })
        : await prisma.character.findMany({
          where: { ownerId: user.userId },
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

    res.status(200).json({ characters });
    return;
  }

  // CRIAR PERSONAGEM
  if (req.method === "POST") {
    if (user.role !== "MESTRE") {
      const existing = await prisma.character.findFirst({
        where: { ownerId: user.userId },
      });
      if (existing) {
        res.status(400).json({ message: "Você já possui um personagem" });
        return;
      }
    }

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

    const character = await prisma.character.create({
      data: {
        name: name ?? "Novo Personagem",
        life: life ?? 100,
        maxLife: maxLife ?? life ?? 100,
        xp: xp ?? 0,
        strength: strength ?? 10,
        agility: agility ?? 10,
        vigor: vigor ?? 10,
        intellect: intellect ?? 10,
        presence: presence ?? 10,
        baseDefense: baseDefense ?? 0,
        ownerId: user.userId,
        dodgePresetId: dodgePresetId ?? null,
        counterAttackPresetId: counterAttackPresetId ?? null,
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
    res.status(201).json(character);
    return;
  }

  res.status(405).end();
}

export default authenticate(handler);
