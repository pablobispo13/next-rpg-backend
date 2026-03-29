"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Stack,
  Button,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  CardActions,
  Box,
} from "@mui/material";
import { toast } from "react-toastify";

import api from "../../lib/api";
import { Character } from "../../types/types";
import { useActiveCombats } from "../../lib/useActiveCombats";
import { createCharacterTemplate } from "../../lib/characterTemplate";
import CharacterCombatSelector from "../Character/CharacterCombatSelector";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { CombatProvider } from "../../context/CombatContext";
import { CharacterCard } from "../Character/CharacterCard";
import RecentRollsScreen from "../RecentRollsScreen";

export default function MesaMestre() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [openSelector, setOpenSelector] = useState(false);
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const { combats, reload: reloadCombats } = useActiveCombats();

  const fetchCharacters = useCallback(async () => {
    if (!token) return;
    try {
      const res = await api.get("/characters");
      setCharacters(res.data.characters || []);
    } catch {
      toast.error("Erro ao buscar personagens");
    }
  }, [token]);

  // SSE de personagens
  useEffect(() => {
    if (!token) return;
    fetchCharacters();
  }, [token]);

  const players = characters.filter((c) => c.owner?.role === "JOGADOR");
  const enemies = characters.filter((c) => c.owner?.role === "MESTRE");

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 400px",
        gap: 2,
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* ================= COLUNA PRINCIPAL ================= */}
      <Box sx={{ overflow: "auto", pr: 1 }}>
        <Stack gap={2}>
          {/* COMBATES */}
          {/* COMBATES */}
          <Paper elevation={6} sx={{ p: 3 }}>
            <Stack gap={3}>
              {/* Header */}
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" fontWeight="bold">
                  Combates Ativos
                </Typography>

                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setOpenSelector(true)}
                >
                  Criar combate
                </Button>
              </Stack>

              {/* Conteúdo */}
              {combats.length === 0 ? (
                <Typography color="text.secondary">
                  Nenhum combate ativo no momento.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {combats.map((c) => (
                    <Grid container key={c.id}>
                      <Card
                        sx={{
                          height: "100%",
                          background: "linear-gradient(145deg, #1c1c2e, #23233a)",
                          border: "1px solid #333",
                        }}
                      >
                        <CardContent>
                          <Stack gap={1}>
                            <Typography variant="h6">
                              {`Combate`}
                            </Typography>

                            <Typography variant="caption" color="text.secondary">
                              ID: {c.id}
                            </Typography>

                            <Chip
                              label="Em andamento"
                              color="success"
                              size="small"
                              sx={{ width: "fit-content", mt: 1 }}
                            />
                          </Stack>
                        </CardContent>

                        <CardActions>
                          <Button
                            fullWidth
                            variant="outlined"
                            endIcon={<OpenInNewIcon />}
                            onClick={() =>
                              window.open(
                                `/protected/combat?combatId=${c.id}`,
                                "_blank",
                                "noopener,noreferrer"
                              )
                            }
                          >
                            Abrir combate
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Stack>
          </Paper>

          {/* PERSONAGENS */}
          <Paper elevation={8} sx={{ p: 2, gap: 6 }}>
            <Stack gap={3}>
              <Paper elevation={12} sx={{ p: 2, gap: 6 }}>
                <Stack gap={3}>
                  <Typography variant="h5" fontWeight="bold">
                    Jogadores
                  </Typography>
                  <Stack gap={2} display={"flex"} flexDirection={"row"} flexWrap="wrap" >
                    {players.map((char) => (
                      <CharacterCard
                        key={char.id}
                        character={char}
                        onAcess={() => {
                          window.open(
                            `/protected?view=jogador&characterId=${char.id}`,
                            "_blank",
                            "noopener,noreferrer"
                          )
                        }}
                      />
                    ))}
                  </Stack>
                </Stack>
              </Paper>
              <Paper elevation={12} sx={{ p: 2, gap: 6 }}>
                <Stack gap={3}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5" fontWeight="bold">
                      Inimigos
                    </Typography>

                    <Button
                      variant="outlined"
                      onClick={() => createCharacterTemplate().finally(fetchCharacters)}
                    >
                      Criar personagem de template
                    </Button>
                  </Stack>
                  <Stack gap={2} display={"flex"} flexDirection={"row"} flexWrap="wrap" >
                    {enemies.map((char) => (
                      <CharacterCard
                        key={char.id}
                        character={char}
                        onAcess={() => {
                          window.open(
                            `/protected?view=jogador&characterId=${char.id}`,
                            "_blank",
                            "noopener,noreferrer"
                          )
                        }}
                      />
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            </Stack>
          </Paper>
          <CombatProvider combatId={undefined}>
            <CharacterCombatSelector
              open={openSelector}
              onClose={() => setOpenSelector(false)}
              characters={[...players, ...enemies]}
              onCombatCreated={() => reloadCombats()
              }
            /></CombatProvider>
        </Stack>
      </Box>
      <Box
        sx={{
          borderLeft: "1px solid #333",
          backgroundColor: "#111122",
          p: 2,
          overflow: "auto",
        }}
      >
        <RecentRollsScreen />
      </Box>
    </Box>
  );
}
