import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient, RollResult } from "@prisma/client";

const prisma = new PrismaClient();
let clients: NextApiResponse[] = [];

const ROOM_TOKEN = "Quarentena";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).end();

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  clients.push(res);
  console.log(`[SSE] Novo cliente conectado. Total: ${clients.length}`);

  req.on("close", () => {
    clients = clients.filter((c) => c !== res);
    console.log(`[SSE] Cliente desconectado. Total: ${clients.length}`);
  });

  const interval = setInterval(async () => {
    if (clients.includes(res)) {
      const combat = await prisma.combat.findFirst({
        orderBy: { createdAt: "desc" },
        include: {
          participants: {
            include: {
              character: {
                include: {
                  presets: true,
                  statusEffects: true,
                },
              },
            },
          },
          turns: true,
          logs: { include: { roll: { include: { character: true, preset: true } }, character: true, target: true } },
          rollResults: {
            include: { character: true },
          },
        },
      });
      if (combat) {
        const rollResultsWithTargets = combat.rollResults.map((roll: RollResult) => {
          const targets = roll.targetIds.map((tid: string) => {
            return combat.participants.find((p: any) => p.character.id === tid)?.character || null;/* eslint-disable  @typescript-eslint/no-explicit-any */
          });
          return {
            ...roll,
            targets,
          };
        });
        res.write(`data: ${JSON.stringify({
          ...combat,
          rollResults: rollResultsWithTargets,
        })}\n\n`);
      }
    }
  }, 8000);

  req.on("close", () => clearInterval(interval));
}
