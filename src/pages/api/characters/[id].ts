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
      notes,
      image,
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
        notes,
        image: image || null,
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
        rollResults: { include: { preset: true, logs: true } },
        statusEffects: true,
      },
    });

    res.status(200).json(updated);
    return;
  }

  // CLONAR PERSONAGEM
  if (req.method === "POST") {
    if (user.role !== "MESTRE") {
      res.status(403).json({ message: "Apenas o mestre pode clonar personagens" });
      return;
    }

    const source = await prisma.character.findUnique({
      where: { id },
      include: { presets: true },
    });
    if (!source) {
      res.status(404).json({ message: "Personagem não encontrado" });
      return;
    }

    const cloned = await prisma.character.create({
      data: {
        name: `Cópia de ${source.name}`,
        life: source.life,
        maxLife: source.maxLife,
        xp: source.xp,
        strength: source.strength,
        agility: source.agility,
        vigor: source.vigor,
        intellect: source.intellect,
        presence: source.presence,
        baseDefense: source.baseDefense,
        history: source.history,
        notes: source.notes,
        image: source.image,
        ownerId: source.ownerId,
        dodgePresetId: null,
        blockPresetId: null,
        counterAttackPresetId: null,
      },
    });

    // Clone action presets and map old IDs → new IDs
    const presetIdMap: Record<string, string> = {};
    for (const p of source.presets) {
      const newPreset = await prisma.actionPreset.create({
        data: {
          name: p.name,
          description: p.description,
          type: p.type,
          targetType: p.targetType,
          diceFormula: p.diceFormula,
          impactFormula: p.impactFormula,
          modifier: p.modifier,
          critThreshold: p.critThreshold,
          critMultiplier: p.critMultiplier,
          requiresTurn: p.requiresTurn,
          allowOutOfCombat: p.allowOutOfCombat,
          appliesEffect: p.appliesEffect,
          isAreaEffect: p.isAreaEffect,
          attribute: p.attribute,
          durationTurns: p.durationTurns,
          statAffected: p.statAffected,
          effectAmount: p.effectAmount,
          statusApplied: p.statusApplied,
          characterId: cloned.id,
        },
      });
      presetIdMap[p.id] = newPreset.id;
    }

    // Re-link reaction presets to their cloned counterparts
    await prisma.character.update({
      where: { id: cloned.id },
      data: {
        dodgePresetId: source.dodgePresetId ? (presetIdMap[source.dodgePresetId] ?? null) : null,
        blockPresetId: source.blockPresetId ? (presetIdMap[source.blockPresetId] ?? null) : null,
        counterAttackPresetId: source.counterAttackPresetId ? (presetIdMap[source.counterAttackPresetId] ?? null) : null,
      },
    });

    res.status(201).json({ id: cloned.id, name: cloned.name });
    return;
  }

  // REMOÇÃO
  if (req.method === "DELETE") {
    // Validar se tem combates ativos
    const activeCombats = await prisma.combatParticipant.findMany({
      where: { characterId: id },
      include: { combat: true },
    });

    const hasActiveCombat = activeCombats.some((cp) => cp.combat.active);
    if (hasActiveCombat) {
      return res.status(409).json({
        message: "Não é possível remover personagem em combate ativo",
      });
    }

    // Limpar relações antes de deletar
    await prisma.character.update({
      where: { id },
      data: {
        dodgePresetId: null,
        blockPresetId: null,
        counterAttackPresetId: null,
      },
    });

    // Deletar personagem (cascata remove inventário, presets, logs)
    await prisma.actionPreset.deleteMany({ where: { characterId: id } });
    await prisma.combatParticipant.deleteMany({ where: { characterId: id } });
    await prisma.combatTurn.deleteMany({ where: { characterId: id } });
    await prisma.rollResult.deleteMany({ where: { characterId: id } });
    await prisma.character.delete({ where: { id } });
    res.status(204).end();
    return;
  }

  res.status(405).end();
}

export default authenticate(handler);
