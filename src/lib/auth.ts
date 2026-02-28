import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

export type AuthUser = {
  userId: string;
  role: "MESTRE" | "JOGADOR";
  username: string;
};

export interface AuthenticatedRequest extends NextApiRequest {
  user?: AuthUser;
}

export function authenticate(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => void | Promise<void>
) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader)
        return res.status(401).json({ message: "Não autorizado" });

      const [scheme, token] = authHeader.split(" ");
      if (scheme !== "Bearer" || !token)
        return res.status(401).json({ message: "Token inválido ou ausente" });

      const secret = process.env.JWT_SECRET!;
      const decoded = jwt.verify(token, secret) as any;/* eslint-disable  @typescript-eslint/no-explicit-any */

      if (!decoded.userId || !decoded.role || !decoded.username)
        return res.status(401).json({ message: "Token inválido" });

      req.user = {
        userId: decoded.userId,
        role: decoded.role,
        username: decoded.username,
      };

      return handler(req, res);
    } catch {
      return res.status(401).json({ message: "Token inválido" });
    }
  };
}
