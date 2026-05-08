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

export function InventoryItemModal({ open, characterId, item, onClose }: Props) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (item) {
      setName(item.name);
      setQuantity(item.quantity);
      setDescription(item.description ?? "");
    } else {
      setName("");
      setQuantity(1);
      setDescription("");
    }
  }, [item, open]);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.post("/inventory", {
        action: item ? "update" : "add",
        characterId,
        itemId: item?.id,
        name: name.trim(),
        quantity: Math.max(1, quantity),
        description,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && name.trim()) {
      e.preventDefault();
      handleSave();
    }
  };

  return (
    <Dialog
      open={open}
      onClose={(_, reason) => { if (reason !== "backdropClick") onClose(); }}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { bgcolor: "#12121e" } }}
    >
      <DialogTitle>{item ? "Editar Item" : "Adicionar Item"}</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Nome"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            fullWidth
            autoFocus
          />
          <TextField
            label="Quantidade"
            type="number"
            inputProps={{ min: 1 }}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
            onKeyDown={handleKeyDown}
            fullWidth
          />
          <TextField
            multiline
            rows={4}
            label="Descrição"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            helperText="Shift+Enter para nova linha"
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={saving}>
          Cancelar
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!name.trim() || saving}
        >
          {saving ? "Salvando…" : "Salvar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
