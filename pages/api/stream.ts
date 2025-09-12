import type { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
let clients: NextApiResponse[] = [];

export const notifyClients = async () => {
  const allChars = await prisma.character.findMany({ include: { owner: true } });
  clients.forEach((client) => client.write(`data: ${JSON.stringify(allChars)}\n\n`));
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
  res.write(`data: ${JSON.stringify(characters)}\n\n`);
}
