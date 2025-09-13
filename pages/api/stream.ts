// pages/api/stream.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
let clients: NextApiResponse[] = [];

// Token fixo da mesa/sala (pode ser dinâmico se você criar múltiplas mesas)
const ROOM_TOKEN = "mesa-unificada-123";

// Função que notifica todos os clientes SSE conectados
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

  // adiciona cliente à lista
  clients.push(res);
  console.log(`[SSE] Novo cliente conectado. Total: ${clients.length}`);

  // Remove cliente ao desconectar
  req.on("close", () => {
    clients = clients.filter((c) => c !== res);
    console.log(`[SSE] Cliente desconectado. Total: ${clients.length}`);
  });

  // envia estado inicial
  const characters = await prisma.character.findMany({ include: { owner: true } });
  const payload = {
    characters,
    roomToken: ROOM_TOKEN,
  };
  res.write(`data: ${JSON.stringify(payload)}\n\n`);

  // opcional: envia updates periódicos, ex: a cada 2s
  const interval = setInterval(async () => {
    if (clients.includes(res)) {
      const chars = await prisma.character.findMany({ include: { owner: true } });
      res.write(`data: ${JSON.stringify({ characters: chars, roomToken: ROOM_TOKEN })}\n\n`);
    }
  }, 2000);

  req.on("close", () => clearInterval(interval));
}
