import type { NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Array global de clientes SSE
export const clients: NextApiResponse[] = [];

// Notifica todos os clientes com todos os personagens
export async function notifyClients() {
  const characters = await prisma.character.findMany({ include: { owner: true } });

  console.log(`[SSE] Notificando ${clients.length} cliente(s)`);

  clients.forEach((res, i) => {
    try {
      res.write(`data: ${JSON.stringify(characters)}\n\n`);
      console.log(`[SSE] Cliente ${i + 1} notificado`);
    } catch (err) {
      console.error(`[SSE] Erro notificando cliente ${i + 1}:`, err);
    }
  });
}
