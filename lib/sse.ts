import { NextApiResponse } from "next";
import { prisma } from "./prisma";

type SSEClient = {
  res: NextApiResponse;
  userId: string;
};

let clients: SSEClient[] = [];
const ROOM_TOKEN = "Quarentena";

export function addClient(client: SSEClient) {
  clients.push(client);
  console.log(`[SSE] Cliente conectado (${clients.length})`);
}

export function removeClient(client: SSEClient) {
  clients = clients.filter((c) => c !== client);
  console.log(`[SSE] Cliente desconectado (${clients.length})`);
}

/**
 * Notifica todos os clientes SSE com o estado atual
 * Pode enviar payload customizado ou o padrão de characters
 */
export async function notifyClients(customPayload?: any): Promise<void> {
  let payload: any;

  if (customPayload) {
    payload = customPayload;
  } else {
    const characters = await prisma.character.findMany({
      include: {
        owner: { select: { id: true, username: true } },
      },
    });

    payload = {
      roomToken: ROOM_TOKEN,
      characters,
    };
  }

  clients.forEach((client) => {
    try {
      client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
    } catch (err) {
      console.warn(`[SSE] Erro ao notificar cliente ${client.userId}: ${err}`);
      removeClient(client);
    }
  });
}
