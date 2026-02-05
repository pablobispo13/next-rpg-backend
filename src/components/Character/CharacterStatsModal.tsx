"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Stack,
  Divider,
} from "@mui/material";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import { Character } from "../../types/types";

type Props = {
  open: boolean;
  character: Character | null;
  onClose: () => void;
};

export function CharacterStatsModal({
  open,
  character,
  onClose,
}: Props) {
  const [form, setForm] = useState({
    name: "",
    life: 0,
    maxLife: 0,
    xp: 0,
    baseDefense: 0,
    strength: 0,
    agility: 0,
    vigor: 0,
    intellect: 0,
    presence: 0,
  });

  useEffect(() => {
    if (character && open) {
      setForm({
        name: character.name,
        life: character.life,
        maxLife: character.maxLife,
        xp: character.xp,
        baseDefense: character.baseDefense ?? 0,
        strength: character.strength,
        agility: character.agility,
        vigor: character.vigor,
        intellect: character.intellect,
        presence: character.presence,
      });
    }
  }, [character, open]);

  const update = (key: string, value: any) =>/* eslint-disable  @typescript-eslint/no-explicit-any */
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSave = async () => {
    if (form.life > form.maxLife) {
      alert("A vida atual não pode ser maior que a vida máxima.");
      return;
    }

    await api.put(`/characters/${character?.id}`, {
      ...form,
      life: Number(form.life),
      maxLife: Number(form.maxLife),
      xp: Number(form.xp),
      baseDefense: Number(form.baseDefense),
      strength: Number(form.strength),
      agility: Number(form.agility),
      vigor: Number(form.vigor),
      intellect: Number(form.intellect),
      presence: Number(form.presence),
    });

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Editar Dados do Personagem</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Nome"
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            fullWidth
          />

          <Divider />

          <Stack direction="row" spacing={2}>
            <TextField
              label="Vida Atual"
              type="number"
              value={form.life}
              onChange={(e) => update("life", e.target.value)}
              fullWidth
            />
            <TextField
              label="Vida Máxima"
              type="number"
              value={form.maxLife}
              onChange={(e) => update("maxLife", e.target.value)}
              fullWidth
            />
          </Stack>
          <Divider />

          <TextField
            label="Defesa Base"
            type="number"
            value={form.baseDefense}
            onChange={(e) => update("baseDefense", e.target.value)}
          />

          <Divider />

          <Stack direction="row" spacing={2}>
            <TextField label="Força" type="number" value={form.strength} onChange={e => update("strength", e.target.value)} />
            <TextField label="Agilidade" type="number" value={form.agility} onChange={e => update("agility", e.target.value)} />
          </Stack>

          <Stack direction="row" spacing={2}>
            <TextField label="Vigor" type="number" value={form.vigor} onChange={e => update("vigor", e.target.value)} />
            <TextField label="Intelecto" type="number" value={form.intellect} onChange={e => update("intellect", e.target.value)} />
            <TextField label="Presença" type="number" value={form.presence} onChange={e => update("presence", e.target.value)} />
          </Stack>
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">Cancelar</Button>
        <Button variant="contained" onClick={handleSave}>Salvar</Button>
      </DialogActions>
    </Dialog>
  );
}
