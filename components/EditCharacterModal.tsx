"use client";

import { useState, useEffect } from "react";
import { Box, Modal, TextField, Button } from "@mui/material";
import axios from "axios";

type Character = {
  id: string;
  name: string;
  life: number;
  xp: number;
  agility: number;
  strength: number;
  vigor: number;
  presence: number;
  intellect: number;
  ownerId: string;
};

type Props = {
  character: Character;
  onClose: () => void;
  onSave: (updated: Character) => void;
  canSave: boolean; // controla se é apenas visualização
};

export default function EditCharacterModal({ character, onClose, onSave, canSave }: Props) {
  const [form, setForm] = useState<Character>({ ...character });
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

  useEffect(() => {
    setForm({ ...character });
  }, [character]);

  const handleChange = (field: keyof Character, value: any) => {// eslint-disable-line @typescript-eslint/no-explicit-any 
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!token) return;
    try {
      const res = await axios.put(`/api/characters/${form.id}`, form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onSave(res.data); // envia para o parent atualizar estado
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Modal open={true} onClose={onClose}>
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: 400,
          bgcolor: "background.paper",
          boxShadow: 24,
          p: 4,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <TextField
          label="Nome"
          value={form.name}
          onChange={(e) => handleChange("name", e.target.value)}
          disabled={!canSave}
        />
        <TextField
          label="Life"
          type="number"
          value={form.life}
          onChange={(e) => handleChange("life", Number(e.target.value))}
          disabled={!canSave}
        />
        <TextField
          label="XP"
          type="number"
          value={form.xp}
          onChange={(e) => handleChange("xp", Number(e.target.value))}
          disabled={!canSave}
        />
        <TextField
          label="Agility"
          type="number"
          value={form.agility}
          onChange={(e) => handleChange("agility", Number(e.target.value))}
          disabled={!canSave}
        />
        <TextField
          label="Strength"
          type="number"
          value={form.strength}
          onChange={(e) => handleChange("strength", Number(e.target.value))}
          disabled={!canSave}
        />
        <TextField
          label="Vigor"
          type="number"
          value={form.vigor}
          onChange={(e) => handleChange("vigor", Number(e.target.value))}
          disabled={!canSave}
        />
        <TextField
          label="Presence"
          type="number"
          value={form.presence}
          onChange={(e) => handleChange("presence", Number(e.target.value))}
          disabled={!canSave}
        />
        <TextField
          label="Intellect"
          type="number"
          value={form.intellect}
          onChange={(e) => handleChange("intellect", Number(e.target.value))}
          disabled={!canSave}
        />

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 2 }}>
          {canSave && (
            <Button variant="contained" onClick={handleSubmit}>
              Salvar
            </Button>
          )}
          <Button variant="outlined" onClick={onClose}>
            Fechar
          </Button>
        </Box>
      </Box>
    </Modal>
  );
}
