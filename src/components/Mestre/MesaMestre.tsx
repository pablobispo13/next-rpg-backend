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
import Head from "next/head";

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
        gridTemplateColumns: "1fr 380px",
        gap: 2,
        height: "100vh",
        overflow: "hidden",
        background: "#0e0e1a",
      }}
    >
      <Head>
        <title>Mesa Mestre</title>
      </Head>
      {/* ================= COLUNA PRINCIPAL ================= */}
      <Box sx={{ overflow: "auto", pr: 1 }}>
        <Stack gap={2}>
          {/* COMBATES */}
          {/* COMBATES */}
          <Paper elevation={6} sx={{
            p: 3,
            background: "linear-gradient(135deg, rgba(28, 28, 46, 0.6) 0%, rgba(14, 14, 26, 0.9) 100%)",
            border: "1px solid rgba(107, 122, 219, 0.2)",
          }}>
            <Stack gap={3}>
              {/* Header */}
              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="h5" fontWeight="bold" sx={{ fontSize: "1.3rem", letterSpacing: 0.5 }}>
                  ⚔️ Combates Ativos
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
                          background: "linear-gradient(135deg, rgba(42, 42, 85, 0.5) 0%, rgba(28, 28, 46, 0.7) 100%)",
                          border: "2px solid rgba(79, 195, 247, 0.3)",
                          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          cursor: "pointer",
                          "&:hover": {
                            border: "2px solid rgba(79, 195, 247, 0.8)",
                            boxShadow: "0 0 20px rgba(79, 195, 247, 0.4)",
                            transform: "translateY(-4px)",
                          },
                        }}
                      >
                        <CardContent>
                          <Stack gap={1}>
                            <Typography variant="h6" fontWeight="bold">
                              {`Combate #${c.id.slice(0, 8)}`}
                            </Typography>

                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.85rem" }}>
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
          <Paper elevation={8} sx={{
            p: 2,
            gap: 6,
            background: "linear-gradient(135deg, rgba(28, 28, 46, 0.6) 0%, rgba(14, 14, 26, 0.9) 100%)",
            border: "1px solid rgba(107, 122, 219, 0.2)",
          }}>
            <Stack gap={3}>
              <Paper elevation={12} sx={{
                p: 2,
                gap: 6,
                background: "rgba(28, 28, 46, 0.4)",
                border: "1px solid rgba(102, 187, 106, 0.2)",
              }}>
                <Stack gap={3}>
                  <Typography variant="h5" fontWeight="bold" sx={{ fontSize: "1.2rem", letterSpacing: 0.5, color: "#66bb6a" }}>
                    👥 Jogadores
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
                        onDelete={() => fetchCharacters()}
                      />
                    ))}
                  </Stack>
                </Stack>
              </Paper>
              <Paper elevation={12} sx={{
                p: 2,
                gap: 6,
                background: "rgba(42, 42, 85, 0.3)",
                border: "1px solid rgba(239, 83, 80, 0.2)",
              }}>
                <Stack gap={3}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5" fontWeight="bold" sx={{ fontSize: "1.2rem", letterSpacing: 0.5, color: "#ef5350" }}>
                      ⚔️ Inimigos
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
                        onDelete={() => fetchCharacters()}
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
          borderLeft: "1px solid rgba(107, 122, 219, 0.2)",
          backgroundColor: "rgba(14, 14, 26, 0.8)",
          p: 2,
          overflow: "auto",
          background: "linear-gradient(135deg, rgba(28, 28, 46, 0.6) 0%, rgba(14, 14, 26, 0.9) 100%)",
        }}
      >
        <RecentRollsScreen />
      </Box>
    </Box>
  );
}
