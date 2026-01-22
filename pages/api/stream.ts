import type { NextApiResponse, NextApiRequest } from "next";
import { prisma } from "../../lib/prisma";
import { addClient, removeClient } from "../../lib/sse";
import jwt from "jsonwebtoken";
import { AuthUser } from "../../lib/auth";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.status(405).end();
    return;
  }

  try {
    const token = req.query.token as string;
    if (!token) return res.status(401).json({ message: "Token ausente" });

    const secret = process.env.JWT_SECRET!;
    const decoded = jwt.verify(token, secret) as AuthUser;

    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const client = {
      res,
      userId: decoded.userId,
    };

    addClient(client);

    req.on("close", () => {
      removeClient(client);
    });

    const characters = await prisma.character.findMany({
      include: { owner: { select: { id: true, username: true } } },
    });

    res.write(`data: ${JSON.stringify({ roomToken: "Quarentena", characters })}\n\n`);
  } catch (err) {
    console.error(err);
    res.status(401).end();
  }
}
