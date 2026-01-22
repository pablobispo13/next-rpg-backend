// pages/api/inventory.ts
import type { NextApiResponse } from "next";
import { prisma } from "../../lib/prisma";
import { authenticate, AuthenticatedRequest } from "../../lib/auth";
import { notifyClients } from "../../lib/sse";

type InventoryBody = {
    action: "list" | "add" | "update" | "delete";
    characterId?: string;
    itemId?: string;
    name?: string;
    quantity?: number;
    presetId?: string;
};

async function handler(req: AuthenticatedRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        res.status(405).end();
        return;
    }

    const user = req.user!;
    const { action, characterId, itemId, name, quantity = 1, presetId }: InventoryBody = req.body;

    if (!characterId && action !== "list") {
        return res.status(400).json({ message: "É necessário informar o personagem" });
    }

    const character = characterId
        ? await prisma.character.findUnique({ where: { id: characterId } })
        : null;

    if (character && user.role !== "MESTRE" && character.ownerId !== user.userId) {
        return res.status(403).json({ message: "Acesso negado ao personagem" });
    }

    switch (action) {
        case "list":
            if (!characterId) return res.status(400).json({ message: "Informe o personagem para listar o inventário" });

            const items = await prisma.inventory.findMany({
                where: { characterId },
                include: { preset: true }, // inclui detalhes do preset, se houver
            });

            return res.status(200).json({ items });

        case "add":
            if (!name) return res.status(400).json({ message: "Informe o nome do item" });

            const newItem = await prisma.inventory.create({
                data: {
                    name,
                    quantity,
                    characterId: characterId!,
                    presetId: presetId ?? undefined,
                },
                include: { preset: true },
            });

            await notifyClients(); // atualiza front em tempo real
            return res.status(201).json({ item: newItem });

        case "update":
            if (!itemId) return res.status(400).json({ message: "Informe o ID do item a ser atualizado" });

            const existingItem = await prisma.inventory.findUnique({ where: { id: itemId } });
            if (!existingItem) return res.status(404).json({ message: "Item não encontrado" });

            // valida acesso
            const itemOwner = await prisma.character.findUnique({ where: { id: existingItem.characterId } });
            if (user.role !== "MESTRE" && itemOwner?.ownerId !== user.userId) {
                return res.status(403).json({ message: "Acesso negado ao item" });
            }

            const updatedItem = await prisma.inventory.update({
                where: { id: itemId },
                data: {
                    name: name ?? existingItem.name,
                    quantity: quantity ?? existingItem.quantity,
                    presetId: presetId ?? existingItem.presetId,
                },
                include: { preset: true },
            });

            await notifyClients();
            return res.status(200).json({ item: updatedItem });

        case "delete":
            if (!itemId) return res.status(400).json({ message: "Informe o ID do item a ser removido" });

            const itemToDelete = await prisma.inventory.findUnique({ where: { id: itemId } });
            if (!itemToDelete) return res.status(404).json({ message: "Item não encontrado" });

            const ownerCheck = await prisma.character.findUnique({ where: { id: itemToDelete.characterId } });
            if (user.role !== "MESTRE" && ownerCheck?.ownerId !== user.userId) {
                return res.status(403).json({ message: "Acesso negado ao item" });
            }

            await prisma.inventory.delete({ where: { id: itemId } });
            await notifyClients();
            return res.status(200).json({ message: "Item removido" });

        default:
            return res.status(400).json({ message: "Ação inválida" });
    }
}

export default authenticate(handler);
