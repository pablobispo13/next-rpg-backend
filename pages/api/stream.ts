import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
let clients: NextApiResponse[] = [];

const ROOM_TOKEN = "Quarentena";

export const notifyClients = async () => {
  const characters = await prisma.character.findMany({ include: { owner: true } });
  const payload = { characters, roomToken: ROOM_TOKEN };
  clients.forEach((res) => res.write(`data: ${JSON.stringify(payload)}\n\n`));
};

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

  const characters = await prisma.character.findMany({ include: { owner: true } });
  const payload = {
    characters,
    roomToken: ROOM_TOKEN,
  };
  res.write(`data: ${JSON.stringify(payload)}\n\n`);

  const interval = setInterval(async () => {
    if (clients.includes(res)) {
      const chars = await prisma.character.findMany({ include: { owner: true } });
      res.write(`data: ${JSON.stringify({ characters: chars, roomToken: ROOM_TOKEN })}\n\n`);
    }
  }, 2000);

  req.on("close", () => clearInterval(interval));
}
