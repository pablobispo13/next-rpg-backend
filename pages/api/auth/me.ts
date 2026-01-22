import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { prisma } from "../../../lib/prisma";

type JwtPayload = {
    userId: string;
    role: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse
) {
    if (req.method !== "GET") return res.status(405).end();

    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: "Token não informado" });
    }

    const [, token] = authHeader.split(" ");

    if (!token) {
        return res.status(401).json({ message: "Token malformado" });
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET!
        ) as JwtPayload;

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            select: {
                id: true,
                username: true,
                email: true,
                role: true,
            },
        });

        if (!user) {
            return res.status(401).json({ message: "Usuário não encontrado" });
        }

        return res.status(200).json({ user });
    } catch (error) {
        return res.status(401).json({ message: "Token inválido ou expirado" });
    }
}
