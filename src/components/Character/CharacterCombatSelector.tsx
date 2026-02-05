"use client";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Stack,
    Typography,
    Paper,
    Checkbox,
    Chip,
} from "@mui/material";
import { useState } from "react";
import { useCombat } from "../../context/CombatContext";
type Character = {
    id: string;
    name: string;
};

type Props = {
    open: boolean;
    onClose: () => void;
    characters: Character[];
    onCombatCreated: (combat: { id: string }) => void;
};

export default function CharacterCombatSelector({
    open,
    characters,
    onClose,
    onCombatCreated,
}: Props) {
    const { startCombat } = useCombat(); // ⬅️ pega a função do contexto
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const toggle = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );
    };

    const confirm = async () => {
        if (selectedIds.length === 0) return;

        try {
            setLoading(true);

            // Chama a função do CombatContext
            await startCombat(selectedIds);

            setSelectedIds([]);
            onClose();

            // Opcional: você pode buscar o combate atualizado para passar para o parent
            // Aqui assumimos que o context já atualizou o estado
            onCombatCreated({ id: "" }); // ou passe o id correto se precisar
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
            <DialogTitle>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Criar Combate</Typography>
                    <Chip
                        label={`${selectedIds.length} selecionado(s)`}
                        color={selectedIds.length > 0 ? "primary" : "default"}
                        size="small"
                    />
                </Stack>
            </DialogTitle>

            <DialogContent dividers>
                <Typography variant="body2" color="text.secondary" mb={2}>
                    Selecione os personagens que participarão do combate.
                </Typography>

                <Stack spacing={1}>
                    {characters.map((c) => {
                        const selected = selectedIds.includes(c.id);

                        return (
                            <Paper
                                key={c.id}
                                onClick={() => toggle(c.id)}
                                sx={{
                                    p: 1.5,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "space-between",
                                    border: selected ? "2px solid #4fc3f7" : "1px solid #333",
                                    backgroundColor: selected ? "#1e2a3a" : "transparent",
                                    transition: "all .15s ease",
                                }}
                            >
                                <Typography>{c.name}</Typography>
                                <Checkbox checked={selected} />
                            </Paper>
                        );
                    })}
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    variant="contained"
                    disabled={selectedIds.length === 0 || loading}
                    onClick={confirm}
                >
                    Criar combate
                </Button>
            </DialogActions>
        </Dialog>
    );
}
