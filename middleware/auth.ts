import { NextApiRequest, NextApiResponse } from "next";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface AuthenticatedRequest extends NextApiRequest {
  user?: string | JwtPayload;
}

type ApiHandler = (req: AuthenticatedRequest, res: NextApiResponse) => Promise<void> | void;

export const authenticate =
  (handler: ApiHandler) => async (req: NextApiRequest, res: NextApiResponse) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
      return res.status(401).json({ message: "Token missing" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      (req as AuthenticatedRequest).user = decoded;
      return handler(req as AuthenticatedRequest, res);
    } catch {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
