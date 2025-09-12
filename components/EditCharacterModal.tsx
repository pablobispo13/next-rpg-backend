"use client";

import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from "@mui/material";
import { useState } from "react";
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
  owner?: { username: string };
};
interface Props {
  character: Character;
  onClose: () => void;
  onSave: () => void;
}

export default function EditCharacterModal({ character, onClose, onSave }: Props) {
  const [formData, setFormData] = useState({
    name: character.name,
    life: character.life,
    xp: character.xp,
    agility: character.agility,
    strength: character.strength,
    vigor: character.vigor,
    presence: character.presence,
    intellect: character.intellect,
  });

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : "";

  const handleSave = async () => {
    await axios.put(`/api/characters/${character.id}`, formData, {
      headers: { Authorization: `Bearer ${token}` },
    });
    onClose();
    onSave();
  };

  return (
    <Dialog open onClose={onClose}>
      <DialogTitle>Editar Personagem</DialogTitle>
      <DialogContent>
        {Object.keys(formData).map((key) => (
          <TextField
            key={key}
            label={key.charAt(0).toUpperCase() + key.slice(1)}
            fullWidth
            margin="dense"
            type={typeof formData[key as keyof typeof formData] === "number" ? "number" : "text"}
            value={formData[key as keyof typeof formData]}
            onChange={(e) => {
              const value = typeof formData[key as keyof typeof formData] === "number"
                ? Number(e.target.value)
                : e.target.value;
              setFormData({ ...formData, [key]: value });
            }}
          />
        ))}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancelar</Button>
        <Button variant="contained" onClick={handleSave}>Salvar</Button>
      </DialogActions>
    </Dialog>
  );
}
