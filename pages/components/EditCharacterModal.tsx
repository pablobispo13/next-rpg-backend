"use client";

import axios from "axios";
import { useEffect, } from "react";
import { TextField, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Stack } from "@mui/material";
import { Character } from "@/protected/mesa";
import { useCharacterForm } from "../../hooks/useCharacterForm";
import { EditableCharacter } from "../../validation/character";

type Props = {
  open: boolean;
  visualization?: boolean;
  character: Character;
  onSave?: (updated: Character) => void;
  onClose: () => void;
};

export default function EditCharacterModal({
  open,
  character,
  visualization = false,
  onClose,
  onSave,
}: Props) {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useCharacterForm(character);

  useEffect(() => {
    reset(character);
  }, [character, reset]);

  const onSubmit = async (data: EditableCharacter) => {
    if (!token) return;
    try {
      const res = await axios.put(`/api/characters/${character.id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onSave?.(res.data);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth={"lg"}
    >
      <DialogTitle id="scroll-dialog-title">Modal de edição de personagem</DialogTitle>
      <DialogContent>
        <Stack gap={2}>
          <Typography>Dados do personagem, pertence á: {character?.owner?.username || "Mestre"}</Typography>
          <Stack gap={1} justifyContent={"space-between"} direction={"row"}>
            <TextField
              label="Nome"
              {...register("name")}
              error={!!errors.name}
              helperText={errors.name?.message}
              disabled={visualization}
              fullWidth
            />
            <TextField
              label="Vida"
              type="number"
              {...register("life")}
              error={!!errors.life}
              helperText={errors.life?.message}
              disabled={visualization}
              fullWidth
            />
            <TextField
              label="XP"
              type="number"
              {...register("xp")}
              error={!!errors.xp}
              helperText={errors.xp?.message}
              disabled={visualization}
              fullWidth
            />
          </Stack>
          <Typography>Atributos</Typography>
          <Stack gap={1} justifyContent={"space-between"} direction={"row"}>
            <TextField
              label="Agilidade"
              type="number"
              {...register("agility")}
              error={!!errors.agility}
              helperText={errors.agility?.message}
              disabled={visualization} fullWidth
            />
            <TextField
              label="Força"
              type="number"
              {...register("strength")}
              error={!!errors.strength}
              helperText={errors.strength?.message}
              disabled={visualization} fullWidth
            />
            <TextField
              label="Vigor"
              type="number"
              {...register("vigor")}
              error={!!errors.vigor}
              helperText={errors.vigor?.message}
              disabled={visualization} fullWidth
            />
          </Stack>
          <Stack gap={1} justifyContent={"space-between"} direction={"row"}>
            <TextField
              label="Presença"
              type="number"
              {...register("presence")}
              error={!!errors.presence}
              helperText={errors.presence?.message}
              disabled={visualization}
              fullWidth
            />
            <TextField
              label="Inteligencia"
              type="number"
              {...register("intellect")}
              error={!!errors.intellect}
              helperText={errors.intellect?.message}
              disabled={visualization}
              fullWidth
            />
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Stack sx={{ display: "flex", flexDirection: "row", gap: 2, justifyContent: "space-between" }}>
          {!visualization && (
            <Button variant="contained" onClick={handleSubmit(onSubmit)}>
              Salvar
            </Button>
          )}
          <Button variant="outlined" onClick={onClose}>
            Fechar
          </Button>
        </Stack>
      </DialogActions>
    </Dialog >

  );
}
