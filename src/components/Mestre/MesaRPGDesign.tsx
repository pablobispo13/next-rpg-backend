"use client";

import { Box, Stack, Card, CardContent, Typography, LinearProgress, Chip } from "@mui/material";

const fakeCharacters = [
  { id: "1", name: "Aragorn", owner: "Jogador1", life: 85, maxLife: 100, role: "JOGADOR" },
  { id: "2", name: "Legolas", owner: "Jogador2", life: 70, maxLife: 90, role: "JOGADOR" },
  { id: "3", name: "Goblin", owner: "MESTRE", life: 40, maxLife: 50, role: "MESTRE" },
  { id: "4", name: "Orc", owner: "MESTRE", life: 60, maxLife: 60, role: "MESTRE" },
];

export default function MesaRPGDesign() {
  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Mesa do Mestre</Typography>
      <Stack spacing={3}>
        {fakeCharacters.map(char => (
          <Card key={char.id} sx={{ backgroundColor: char.role === "MESTRE" ? "#4d1e1e" : "#1e4d1e", color: "#fff" }}>
            <CardContent>
              <Typography variant="h6">{char.name} ({char.owner})</Typography>
              <Typography>Role: {char.role}</Typography>
              <Typography>Vida: {char.life}/{char.maxLife}</Typography>
              <LinearProgress
                variant="determinate"
                value={(char.life / char.maxLife) * 100}
                sx={{ height: 12, borderRadius: 6, "& .MuiLinearProgress-bar": { backgroundColor: char.role === "MESTRE" ? "#f44336" : "#4caf50" } }}
              />
            </CardContent>
            <Stack direction="row" spacing={1} sx={{ p: 1 }}>
              <Chip label="Ativo" color="info" />
              {char.role === "MESTRE" && <Chip label="Inimigo" color="error" />}
            </Stack>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
