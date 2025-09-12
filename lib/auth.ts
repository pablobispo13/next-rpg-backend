import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends NextApiRequest {
  user?: { userId: string; role: string };
}

export function authenticate(handler: (req: AuthenticatedRequest, res: NextApiResponse) => void | Promise<void>) {
  return async (req: AuthenticatedRequest, res: NextApiResponse) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) return res.status(401).json({ message: "Não autorizado" });

      const token = authHeader.split(" ")[1];
      if (!token) return res.status(401).json({ message: "Token não fornecido" });

      const secret = process.env.JWT_SECRET;
      if (!secret) return res.status(500).json({ message: "JWT_SECRET não configurado" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decoded = jwt.verify(token, secret) as any;
      req.user = { userId: decoded.userId, role: decoded.role };

      return handler(req, res);
    } catch (err) {
      return res.status(401).json({ message: "Token inválido", err });
    }
  };
}
