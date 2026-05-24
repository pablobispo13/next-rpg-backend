import type { NextApiResponse } from "next";
import { authenticate, AuthenticatedRequest } from "../../../lib/auth";
import fs from "fs";
import path from "path";

const ALLOWED_EXT = new Set([".png", ".jpg", ".jpeg", ".webp", ".gif"]);

/**
 * Lista os arquivos de imagem disponíveis em public/characters/.
 * Apenas usuários com isAdmin podem chamar.
 *
 * Para adicionar novas imagens: coloque o arquivo em public/characters/ no repo
 * e faça deploy. Aparecem automaticamente na listagem.
 */
async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
  if (req.method !== "GET") { res.status(405).end(); return; }
  if (!req.user?.isAdmin) {
    res.status(403).json({ message: "Apenas o admin pode gerenciar imagens" });
    return;
  }

  try {
    const dir = path.join(process.cwd(), "public", "characters");
    if (!fs.existsSync(dir)) { res.status(200).json({ images: [] }); return; }

    const files = fs
      .readdirSync(dir)
      .filter((f) => ALLOWED_EXT.has(path.extname(f).toLowerCase()))
      .sort((a, b) => a.localeCompare(b));

    res.status(200).json({ images: files });
  } catch (err) {
    console.error("[/api/admin/images]", err);
    res.status(500).json({ message: "Erro ao listar imagens" });
  }
}

export default authenticate(handler);
