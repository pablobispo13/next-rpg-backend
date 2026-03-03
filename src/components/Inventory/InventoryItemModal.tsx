"use client";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Stack,
} from "@mui/material";
import { useEffect, useState } from "react";
import { CharacterInventory } from "../../types/types";
import api from "../../lib/api";

type Props = {
    open: boolean;
    characterId: string;
    item: CharacterInventory | undefined;
    onClose: () => void;
};

export function InventoryItemModal({
    open,
    characterId,
    item,
    onClose,
}: Props) {
    const [name, setName] = useState("");
    const [quantity, setQuantity] = useState(1);
    const [description, setDescription] = useState("");

    useEffect(() => {
        if (item) {
            setName(item.name);
            setQuantity(item.quantity);
            setDescription(item.description);
        } else {
            setName("");
            setQuantity(1);
            setDescription("");
        }
    }, [item, open]);

    const handleSave = async () => {
        await api.post("/inventory", {
            action: item ? "update" : "add",
            characterId,
            itemId: item?.id,
            name,
            quantity,
            description,
        });

        onClose();
    };

    return (
        <Dialog open={open} onClose={(event, reason) => {
            if (reason !== 'backdropClick')
                onClose()
        }
        } fullWidth maxWidth="sm">
            <DialogTitle>
                {item ? "Editar Item" : "Adicionar Item"}
            </DialogTitle>

            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        label="Nome"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        fullWidth
                    />

                    <TextField
                        label="Quantidade"
                        type="number"
                        inputProps={{ min: 1 }}
                        value={quantity}
                        onChange={(e) => setQuantity(Number(e.target.value))}
                        fullWidth
                    />
                    <TextField
                        multiline
                        rows={4}
                        label="Descrição"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        fullWidth
                    />
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} color="inherit">
                    Cancelar
                </Button>
                <Button variant="contained" onClick={handleSave}>
                    Salvar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
