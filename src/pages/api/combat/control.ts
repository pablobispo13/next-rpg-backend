import type { NextApiResponse } from "next";
import { LogType } from "@prisma/client";
import { authenticate, AuthenticatedRequest } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { rollDice } from "../../../lib/dice";
import { notifyCombatUpdate, notifyCombatListUpdate } from "../../../lib/pusher";

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.status(405).end();
        return;
    }

    const { action, combatId, participantIds, turnId } = req.body;

    switch (action) {
        case "startCombat": {
            if (!participantIds || participantIds.length === 0) {
                res.status(400).json({ message: "Necessário informar participantes" });
                return;
            }

            const newCombat = await prisma.combat.create({
                data: { active: true },
                include: {
                    participants: true,
                    turns: true,
                    logs: true,
                    rollResults: true,
                }
            });

            const participants = await Promise.all(
                participantIds.map(async (pid: string) => {
                    const char = await prisma.character.findUnique({ where: { id: pid } });
                    if (!char) throw new Error(`Personagem ${pid} não encontrado`);
                    return prisma.combatParticipant.create({
                        data: { combatId: newCombat.id, characterId: char.id, currentLife: char.life },
                        include: { character: true }
                    });
                })
            );

            const participantsWithInitiative = await Promise.all(
                participants.map(async (p) => {
                    const char = await prisma.character.findUnique({ where: { id: p.characterId } });
                    const roll = rollDice("1d20");
                    const initiative = roll.total + (char?.agility ?? 0);
                    return { id: p.id, characterId: p.characterId, initiative, agility: char?.agility ?? 0 };
                })
            );

            // Desempate por Agilidade quando iniciativa for igual
            participantsWithInitiative.sort((a, b) => b.initiative - a.initiative || b.agility - a.agility);

            await Promise.all(
                participantsWithInitiative.map((p, index) =>
                    prisma.combatParticipant.update({
                        where: { id: p.id },
                        data: { turnOrder: index, initiative: p.initiative }
                    })
                )
            );

            await prisma.actionLog.create({
                data: { type: LogType.COMBAT_START, message: "Combate iniciado", combatId: newCombat.id }
            });

            const combatFull = await prisma.combat.findUnique({
                where: { id: newCombat.id },
                include: {
                    participants: { include: { character: true } },
                    turns: true,
                    logs: true,
                    rollResults: true,
                }
            });
            notifyCombatUpdate(newCombat.id);
            notifyCombatListUpdate();
            res.status(201).json({ combat: combatFull, order: participantsWithInitiative });
            return;
        }

        case "startTurn": {
            if (!combatId) return res.status(400).json({ message: "Dados insuficientes" });

            const combat = await prisma.combat.findUnique({
                where: { id: combatId },
                include: { participants: { include: { character: true, combat: true } } },
            });
            if (!combat || combat.participants.length === 0) {
                res.status(404).json({ message: "Combate não encontrado ou sem participantes" });
                return;
            }

            const currentIndex = combat.currentTurnIndex;
            const participant = combat.participants.find((p) => p.turnOrder === currentIndex);
            if (!participant) return res.status(400).json({ message: "Nenhum participante para a vez atual" });

            // Idempotência: retorna turno já existente para evitar duplicatas
            const existingTurn = await prisma.combatTurn.findFirst({
                where: { combatId, characterId: participant.characterId, turnNumber: combat.round, endedAt: null },
                include: { rollResults: true, logs: true },
            });
            if (existingTurn) {
                return res.status(200).json(existingTurn);
            }

            const turn = await prisma.combatTurn.create({
                data: { combatId, characterId: participant.characterId, turnNumber: combat.round },
                include: { rollResults: true, logs: true }
            });
            const activeEffects = await prisma.characterEffect.findMany({
                where: { characterId: participant.characterId, remainingTurns: { gt: 0 } }
            });

            const combatParticipantForEffect = await prisma.combatParticipant.findFirst({
                where: { combatId, characterId: participant.characterId }
            });

            for (const effect of activeEffects) {
                const char = await prisma.character.findUnique({ where: { id: participant.characterId } });
                if (!char) continue;

                if (effect.type === "HEAL_OVER_TIME" && combatParticipantForEffect) {
                    const newLife = Math.min(combatParticipantForEffect.currentLife + effect.value, char.maxLife);
                    await prisma.combatParticipant.update({ where: { id: combatParticipantForEffect.id }, data: { currentLife: newLife } });
                    await prisma.actionLog.create({
                        data: {
                            type: LogType.HEAL_OVER_TIME,
                            message: `${char.name} recuperou ${effect.value} de vida por efeito ativo`,
                            characterId: char.id,
                            combatId,
                            turnId: turn.id
                        },
                    });
                }

                if (effect.type === "DAMAGE_OVER_TIME" && combatParticipantForEffect) {
                    const newLife = Math.max(combatParticipantForEffect.currentLife - effect.value, 0);
                    await prisma.combatParticipant.update({ where: { id: combatParticipantForEffect.id }, data: { currentLife: newLife } });
                    await prisma.actionLog.create({
                        data: {
                            type: LogType.DAMAGE_OVER_TIME,
                            message: `${char.name} sofreu ${effect.value} de dano por efeito ativo`,
                            characterId: char.id,
                            combatId,
                            turnId: turn.id
                        },
                    });
                }

                await prisma.characterEffect.update({
                    where: { id: effect.id },
                    data: { remainingTurns: effect.remainingTurns - 1 }
                });

                if (effect.remainingTurns - 1 <= 0) {
                    await prisma.characterEffect.delete({ where: { id: effect.id } });
                }
            }

            await prisma.actionLog.create({
                data: {
                    type: LogType.TURN_START,
                    message: `Turno iniciado para ${participant.character.name}`,
                    characterId: participant.characterId,
                    combatId,
                    turnId: turn.id
                },
            });

            const turnFull = await prisma.combatTurn.findUnique({
                where: { id: turn.id },
                include: {
                    rollResults: true,
                    logs: true,
                }
            });
            notifyCombatUpdate(combatId);
            res.status(201).json(turnFull);
            return;
        }

        case "endTurn": {
            if (!combatId || !turnId) {
                return res.status(400).json({ message: "combatId e turnId são obrigatórios" });
            }
            const turn = await prisma.combatTurn.findUnique({
                where: { id: turnId },
            });

            if (!turn || turn.combatId !== combatId) {
                return res.status(400).json({ message: "Turno inválido para este combate" });
            }

            const combat = await prisma.combat.findUnique({
                where: { id: combatId },
                include: { participants: true }
            });
            if (!combat) return res.status(404).json({ message: "Combate não encontrado" });

            // HP snapshot before advancing the index
            const snapshotData: Record<string, number> = {};
            for (const p of combat.participants) {
                snapshotData[p.characterId] = p.currentLife;
            }
            const newSnapshot = { round: combat.round, turnIndex: combat.currentTurnIndex, data: snapshotData };
            const updatedSnapshots = [...(combat.hpSnapshots as object[]), newSnapshot];

            const sortedParticipants = [...combat.participants].sort((a, b) => (a.turnOrder ?? 0) - (b.turnOrder ?? 0));
            let nextIndex = combat.currentTurnIndex + 1;
            let nextRound = combat.round;

            // Skip dead participants (currentLife <= 0)
            for (let i = 0; i < sortedParticipants.length; i++) {
                if (nextIndex >= sortedParticipants.length) {
                    nextIndex = 0;
                    nextRound += 1;
                }
                if (sortedParticipants[nextIndex].currentLife > 0) break;
                nextIndex++;
            }

            await prisma.combat.update({
                where: { id: combatId },
                data: { currentTurnIndex: nextIndex, round: nextRound, hpSnapshots: updatedSnapshots }
            });

            await prisma.actionLog.create({
                data: { type: LogType.TURN_END, message: `Turno finalizado`, combatId, turnId: turn.id }
            });

            await prisma.combatTurn.update({
                where: { id: turn.id },
                data: { endedAt: new Date() },
            });

            notifyCombatUpdate(combatId);
            res.status(200).json({ message: "Turno finalizado", nextTurnIndex: nextIndex, round: nextRound });
            return;
        }

        case "adjustHp": {
            if (req.user?.role !== "MESTRE") {
                return res.status(403).json({ message: "Apenas o mestre pode ajustar HP" });
            }
            const { characterId: hpCharId, newHp } = req.body;
            if (!combatId || !hpCharId || newHp === undefined) {
                return res.status(400).json({ message: "combatId, characterId e newHp são obrigatórios" });
            }
            const hpParticipant = await prisma.combatParticipant.findFirst({
                where: { combatId, characterId: hpCharId },
            });
            if (!hpParticipant) return res.status(404).json({ message: "Participante não encontrado" });
            const hpChar = await prisma.character.findUnique({ where: { id: hpCharId } });
            const clampedHp = Math.max(0, Math.min(Number(newHp), hpChar?.maxLife ?? Number(newHp)));
            await prisma.combatParticipant.update({
                where: { id: hpParticipant.id },
                data: { currentLife: clampedHp },
            });
            await prisma.actionLog.create({
                data: {
                    type: LogType.MANUAL_OVERRIDE,
                    message: `HP de ${hpChar?.name} ajustado para ${clampedHp} pelo mestre`,
                    characterId: hpCharId,
                    combatId,
                },
            });
            notifyCombatUpdate(combatId);
            return res.status(200).json({ currentLife: clampedHp });
        }

        case "reorderTurns": {
            if (req.user?.role !== "MESTRE") {
                return res.status(403).json({ message: "Apenas o mestre pode reordenar" });
            }
            const { order } = req.body;
            if (!combatId || !order) return res.status(400).json({ message: "Dados inválidos" });

            // Find the participant who is currently active so we can keep pointing at them
            const combatForReorder = await prisma.combat.findUnique({
                where: { id: combatId },
                select: { currentTurnIndex: true, participants: { select: { id: true, turnOrder: true } } },
            });

            await Promise.all(
                (order as { participantId: string; turnOrder: number }[]).map((item) =>
                    prisma.combatParticipant.update({
                        where: { id: item.participantId },
                        data: { turnOrder: item.turnOrder },
                    })
                )
            );

            // Update currentTurnIndex to keep pointing at the same character after reorder
            if (combatForReorder) {
                const activeParticipantId = combatForReorder.participants
                    .find((p) => p.turnOrder === combatForReorder.currentTurnIndex)?.id;

                if (activeParticipantId) {
                    const newTurnOrder = (order as { participantId: string; turnOrder: number }[])
                        .find((item) => item.participantId === activeParticipantId)?.turnOrder;

                    if (newTurnOrder !== undefined) {
                        await prisma.combat.update({
                            where: { id: combatId },
                            data: { currentTurnIndex: newTurnOrder },
                        });
                    }
                }
            }

            notifyCombatUpdate(combatId);
            return res.status(200).json({ message: "Ordem atualizada" });
        }

        case "updateNotes": {
            if (req.user?.role !== "MESTRE") {
                return res.status(403).json({ message: "Apenas o mestre pode editar notas" });
            }
            const { notes } = req.body;
            if (!combatId) return res.status(400).json({ message: "combatId obrigatório" });
            await prisma.combat.update({ where: { id: combatId }, data: { notes: notes ?? "" } });
            return res.status(200).json({ message: "Notas atualizadas" });
        }

        case "setStreamUrl": {
            if (req.user?.role !== "MESTRE") {
                return res.status(403).json({ message: "Apenas o mestre pode configurar a stream" });
            }
            const { streamUrl } = req.body;
            if (!combatId) return res.status(400).json({ message: "combatId obrigatório" });
            await prisma.combat.update({ where: { id: combatId }, data: { streamUrl: streamUrl ?? null } });
            return res.status(200).json({ message: "Stream atualizada" });
        }

        case "endCombat": {
            if (!combatId) return res.status(400).json({ message: "Dados insuficientes" });

            // Sync final HP from CombatParticipant back to Character before closing
            const finalParticipants = await prisma.combatParticipant.findMany({
                where: { combatId },
            });
            await Promise.all(
                finalParticipants.map((p) =>
                    prisma.character.update({
                        where: { id: p.characterId },
                        data: { life: p.currentLife },
                    })
                )
            );

            await prisma.combat.update({ where: { id: combatId }, data: { active: false } });
            await prisma.actionLog.create({ data: { type: LogType.COMBAT_END, message: "Combate finalizado", combatId } });

            // Compute combat statistics
            const rollResults = await prisma.rollResult.findMany({
                where: { combatId },
                include: { character: { select: { id: true, name: true } } }
            });

            const statsByChar: Record<string, { name: string; totalDamage: number; hits: number; misses: number; maxHit: number }> = {};
            for (const r of rollResults) {
                const id = r.characterId;
                if (!statsByChar[id]) {
                    statsByChar[id] = { name: r.character.name, totalDamage: 0, hits: 0, misses: 0, maxHit: 0 };
                }
                if (r.success === true) statsByChar[id].hits++;
                else if (r.success === false) statsByChar[id].misses++;
                if (r.damage) {
                    statsByChar[id].totalDamage += r.damage;
                    statsByChar[id].maxHit = Math.max(statsByChar[id].maxHit, r.damage);
                }
            }

            const combat = await prisma.combat.findUnique({ where: { id: combatId } });
            const stats = {
                rounds: combat?.round ?? 0,
                participants: Object.entries(statsByChar).map(([id, s]) => ({ id, ...s })),
            };

            notifyCombatUpdate(combatId);
            notifyCombatListUpdate();
            res.status(200).json({ message: "Combate encerrado", stats });
            return;
        }

        default:
            res.status(400).json({ message: "Ação inválida" });
            return;
    }
}

export default authenticate(handler);
