"use client";

import {
  Box,
  Typography,
  Stack,
  Card,
  CardContent,
  CardActions,
  Button,
  LinearProgress,
  Chip,
} from "@mui/material";

// Fake Data
const fakePlayers = [
  {
    id: "1",
    name: "Aragorn",
    owner: "Jogador1",
    life: 85,
    maxLife: 100,
    xp: 1200,
    attributes: { strength: 15, agility: 12, vigor: 14, intellect: 10, presence: 11 },
  },
  {
    id: "2",
    name: "Legolas",
    owner: "Jogador2",
    life: 70,
    maxLife: 90,
    xp: 980,
    attributes: { strength: 10, agility: 18, vigor: 12, intellect: 14, presence: 12 },
  },
];

const fakeEnemies = [
  {
    id: "e1",
    name: "Goblin Guerreiro",
    owner: "Mestre",
    life: 50,
    maxLife: 50,
    xp: 0,
    attributes: { strength: 12, agility: 8, vigor: 10, intellect: 5, presence: 4 },
  },
  {
    id: "e2",
    name: "Orc Berserker",
    owner: "Mestre",
    life: 80,
    maxLife: 80,
    xp: 0,
    attributes: { strength: 18, agility: 6, vigor: 16, intellect: 3, presence: 5 },
  },
];

export default function MesaMestreDesign() {
  const players = fakePlayers;
  const enemies = fakeEnemies;

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Mesa do Mestre — Sala: Quarentena
      </Typography>

      {/* Personagens dos Jogadores */}
      <Typography variant="h5" sx={{ mt: 3, mb: 1 }}>
        Personagens dos Jogadores
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap">
        {players.map((char) => (
          <Card key={char.id} sx={{ width: 250, flexShrink: 0 }}>
            <CardContent>
              <Typography variant="h6">{char.name}</Typography>
              <Typography variant="caption">Dono: {char.owner}</Typography>

              {/* Vida */}
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">Vida: {char.life}/{char.maxLife}</Typography>
                <LinearProgress
                  variant="determinate"
                  value={(char.life / char.maxLife) * 100}
                  sx={{ height: 10, borderRadius: 5 }}
                  color="success"
                />
              </Box>

              {/* XP */}
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">XP: {char.xp}</Typography>
                <LinearProgress
                  variant="determinate"
                  value={(char.xp % 1000) / 10}
                  sx={{ height: 8, borderRadius: 5 }}
                  color="info"
                />
              </Box>

              {/* Atributos */}
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                {Object.entries(char.attributes).map(([key, val]) => (
                  <Chip key={key} label={`${key.toUpperCase()}: ${val}`} size="small" />
                ))}
              </Stack>
            </CardContent>
            <CardActions>
              <Button size="small" variant="contained" color="primary">
                Editar
              </Button>
              <Button size="small" variant="outlined">
                Ver
              </Button>
            </CardActions>
          </Card>
        ))}
      </Stack>

      {/* Inimigos do Mestre */}
      <Typography variant="h5" sx={{ mt: 5, mb: 1 }}>
        Inimigos (Criaturas do Mestre)
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} flexWrap="wrap">
        {enemies.map((char) => (
          <Card key={char.id} sx={{ width: 250, flexShrink: 0, bgcolor: "#ffebee" }}>
            <CardContent>
              <Typography variant="h6">{char.name}</Typography>
              <Typography variant="caption">Dono: Mestre</Typography>

              {/* Vida */}
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">Vida: {char.life}/{char.maxLife}</Typography>
                <LinearProgress
                  variant="determinate"
                  value={(char.life / char.maxLife) * 100}
                  sx={{ height: 10, borderRadius: 5 }}
                  color="error"
                />
              </Box>

              {/* Atributos */}
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: "wrap" }}>
                {Object.entries(char.attributes).map(([key, val]) => (
                  <Chip key={key} label={`${key.toUpperCase()}: ${val}`} size="small" />
                ))}
              </Stack>
            </CardContent>
            <CardActions>
              <Button size="small" variant="contained" color="primary">
                Editar
              </Button>
              <Button size="small" variant="outlined">
                Ver
              </Button>
            </CardActions>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
