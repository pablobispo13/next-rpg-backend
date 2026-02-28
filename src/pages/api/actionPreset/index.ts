import { NextApiResponse } from "next";
import { authenticate, AuthenticatedRequest } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { ActionType, AttributeType, TargetType } from "@prisma/client";


async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  const user = req.user!;

  // LISTAR PRESETS
  if (req.method === "GET") {
    const { characterId } = req.query;

    if (typeof characterId !== "string") {
      res.status(400).json({ message: "characterId é obrigatório" });
      return;
    }

    const presets = await prisma.actionPreset.findMany({
      where: { characterId },
      orderBy: { name: "desc" },
      include: {
        characterEffects: true,
        dodgeCharacters: true,
        blockCharacters: true,
        counterAttackCharacters: true,
        rolls: true,
        inventories: true,
        character: true
      },
    });

    res.status(200).json({ presets });
    return;
  }

  // CRIAR PRESET
  if (req.method === "POST") {
    const {
      name,
      description,
      type,
      targetType,
      diceFormula,
      impactFormula,
      modifier,
      critThreshold,
      critMultiplier,
      requiresTurn,
      allowOutOfCombat,
      appliesEffect,
      attribute,
      characterId,
      durationTurns,
      statAffected,
      effectAmount,
      statusApplied,
    } = req.body;

    if (!name || !type || !targetType || !diceFormula || !attribute || !characterId) {
      res.status(400).json({ message: "Dados obrigatórios ausentes" });
      return;
    }

    const character = await prisma.character.findUnique({ where: { id: characterId } });
    if (!character) {
      res.status(404).json({ message: "Personagem não encontrado" });
      return;
    }

    if (user.role !== "MESTRE" && character.ownerId !== user.userId) {
      res.status(403).json({ message: "Sem permissão" });
      return;
    }

    const preset = await prisma.actionPreset.create({
      data: {
        name,
        description,
        type: type as ActionType,
        targetType: targetType as TargetType,
        diceFormula,
        impactFormula,
        modifier: modifier ?? 0,
        critThreshold,
        critMultiplier,
        requiresTurn: requiresTurn ?? true,
        allowOutOfCombat: allowOutOfCombat ?? false,
        appliesEffect: appliesEffect ?? true,
        attribute: attribute as AttributeType,
        characterId,
        durationTurns: durationTurns ?? null,
        statAffected: statAffected ?? null,
        effectAmount: effectAmount ?? null,
        statusApplied: statusApplied ?? null,
      },
      include: {
        characterEffects: true,
        dodgeCharacters: true,
        blockCharacters: true,
        counterAttackCharacters: true,
        rolls: true,
        inventories: true,
      },
    });

   
    res.status(201).json(preset);
    return;
  }

  res.status(405).end();
}

export default authenticate(handler);
