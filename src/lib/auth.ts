import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";

export type AuthUser = {
  userId: string;
  role: "MESTRE" | "JOGADOR";
  username: string;
};

export type CampaignScope = {
  campaignId: string;
  isMaster: boolean;
};

export interface AuthenticatedRequest extends NextApiRequest {
  user?: AuthUser;
  campaign?: CampaignScope;
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

/**
 * Wrapper que exige um campaignId válido (header `x-campaign-id` ou query `campaignId`)
 * e que o usuário autenticado tenha acesso (mestre dono ou membro). Popula `req.campaign`.
 */
export function withCampaign(
  handler: (req: AuthenticatedRequest, res: NextApiResponse) => void | Promise<void>
) {
  return authenticate(async (req, res) => {
    // Import dinâmico evita ciclo com lib/campaignAccess (que importa lib/auth)
    const { getCampaignAccess } = await import("./campaignAccess");

    const headerId = req.headers["x-campaign-id"];
    const queryId = req.query.campaignId;
    const campaignId =
      (typeof headerId === "string" && headerId) ||
      (typeof queryId === "string" && queryId) ||
      null;

    if (!campaignId) {
      return res.status(400).json({ message: "campaignId obrigatório" });
    }

    const access = await getCampaignAccess(req.user!, campaignId);
    if (!access) {
      return res.status(403).json({ message: "Sem acesso a esta mesa" });
    }

    req.campaign = { campaignId, isMaster: access.isMaster };
    return handler(req, res);
  });
}
