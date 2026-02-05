import { Button, Stack } from "@mui/material";
import { CharacterInventory } from "../../types/types";
import api from "../../lib/api";
import { SimpleListItem } from "../Jogador/SimpleListItem";

type Props = {
    item: CharacterInventory;
    canEdit?: boolean;
    onEdit: () => void;
};

export function InventoryItemRow({ item, canEdit, onEdit }: Props) {
    const handleDelete = async () => {
        await api.post("/inventory", {
            action: "delete",
            itemId: item.id,
        });
    };

    return (
        <SimpleListItem>
            <Stack direction="row" justifyContent="space-between" width="100%">
                <span>
                    {item.name} {item.quantity > 1 && `x${item.quantity}`}
                </span>

                {canEdit && (
                    <Stack direction="row" spacing={1}>
                        <Button size="small" onClick={onEdit}>
                            Editar
                        </Button>
                        <Button size="small" color="error" onClick={handleDelete}>
                            Remover
                        </Button>
                    </Stack>
                )}
            </Stack>
        </SimpleListItem>
    );
}
