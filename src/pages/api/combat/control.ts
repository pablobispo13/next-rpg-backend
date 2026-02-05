import type { NextApiResponse } from "next";
import { LogType } from "@prisma/client";
import { authenticate, AuthenticatedRequest } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";
import { rollDice } from "../../../lib/dice";

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
                    return { id: p.id, characterId: p.characterId, initiative };
                })
            );

            participantsWithInitiative.sort((a, b) => b.initiative - a.initiative);

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

            const turn = await prisma.combatTurn.create({
                data: { combatId, characterId: participant.characterId, turnNumber: combat.round },
                include: { rollResults: true, logs: true }
            });
            const activeEffects = await prisma.characterEffect.findMany({
                where: { characterId: participant.characterId, remainingTurns: { gt: 0 } }
            });

            for (const effect of activeEffects) {
                const char = await prisma.character.findUnique({ where: { id: participant.characterId } });
                if (!char) continue;

                if (effect.type === "HEAL_OVER_TIME") {
                    const newLife = Math.min(char.life + effect.value, char.maxLife);
                    await prisma.character.update({ where: { id: char.id }, data: { life: newLife } });
                    await prisma.actionLog.create({
                        data: {
                            type: LogType.HEAL,
                            message: `${char.name} recuperou ${effect.value} de vida por efeito ativo`,
                            characterId: char.id,
                            combatId,
                            turnId: turn.id
                        },
                    });
                }

                if (effect.type === "DAMAGE_OVER_TIME") {
                    const newLife = Math.max(char.life - effect.value, 0);
                    await prisma.character.update({ where: { id: char.id }, data: { life: newLife } });
                    await prisma.actionLog.create({
                        data: {
                            type: LogType.DAMAGE,
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

            const combat = await prisma.combat.findUnique({ where: { id: combatId }, include: { participants: true } });
            if (!combat) return res.status(404).json({ message: "Combate não encontrado" });

            let nextIndex = combat.currentTurnIndex + 1;
            let nextRound = combat.round;
            if (nextIndex >= combat.participants.length) {
                nextIndex = 0;
                nextRound += 1;
            }

            await prisma.combat.update({ where: { id: combatId }, data: { currentTurnIndex: nextIndex, round: nextRound } });

            await prisma.actionLog.create({
                data: { type: LogType.TURN_END, message: `Turno finalizado`, combatId, turnId: turn.id, }
            });

            await prisma.combatTurn.update({
                where: { id: turn.id },
                data: { endedAt: new Date() },
            });
            // await notifyClients();
            res.status(200).json({ message: "Turno finalizado", nextTurnIndex: nextIndex, round: nextRound });
            return;
        }

        case "endCombat": {
            if (!combatId) return res.status(400).json({ message: "Dados insuficientes" });

            await prisma.combat.update({ where: { id: combatId }, data: { active: false } });
            await prisma.actionLog.create({ data: { type: LogType.COMBAT_END, message: "Combate finalizado", combatId } });
            res.status(200).json({ message: "Combate encerrado" });
            return;
        }

        default:
            res.status(400).json({ message: "Ação inválida" });
            return;
    }
}

export default authenticate(handler);
