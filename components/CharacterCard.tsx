"use client";

import React from "react";
import { Card, CardContent, Typography, Button, Box } from "@mui/material";

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

type Props = {
  character: Character;
  onEdit?: (char: Character) => void;
};

export default function CharacterCard({ character, onEdit }: Props) {
  return (
    <Card sx={{ width: 250 }}>
      <CardContent>
        <Typography variant="h6">{character.name}</Typography>
        {character.owner && (
          <Typography variant="caption">Dono: {character.owner.username}</Typography>
        )}
        <Box sx={{ mt: 1 }}>
          <Typography>Life: {character.life}</Typography>
          <Typography>XP: {character.xp}</Typography>
          <Typography>Agility: {character.agility}</Typography>
          <Typography>Strength: {character.strength}</Typography>
          <Typography>Vigor: {character.vigor}</Typography>
          <Typography>Presence: {character.presence}</Typography>
          <Typography>Intellect: {character.intellect}</Typography>
        </Box>
        {onEdit && (
          <Button
            variant="contained"
            size="small"
            sx={{ mt: 2 }}
            onClick={() => onEdit(character)}
          >
            Editar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
