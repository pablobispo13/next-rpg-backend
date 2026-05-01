"use client";

import {
  Box,
  Stack,
  Typography,
  Card,
  CardContent,
  Button,
  LinearProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
} from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { useCombat, CombatProvider } from "../../context/CombatContext";
import api from "../../lib/api";
import { useRouter } from "next/router";
import { ActionPresetType } from "../../types/types";
import { CombatTimeline } from "./CombatTimeline";
import { DiceInputRoller } from "../DiceInputRoller";
import Head from "next/head";

type CombatScreenProps = { combatId: string };

export default function CombatScreen({ combatId }: CombatScreenProps) {
  const { user } = useAuth();
  const isMaster = user?.role === "MESTRE";

  return (
    <CombatProvider combatId={combatId}>
      <CombatScreenContent isMaster={isMaster} />
    </CombatProvider>
  );
}

function CombatScreenContent({ isMaster }: { isMaster: boolean }) {
  const {
    combat,
    isMyTurn,
    actionUsed,
    myCharacterIds,
    selectedTargets,
    selectTarget,
    useMainAction,
    endTurn,
    pendingReactionRoll,
    resolveReaction,
    refreshCombat,
    nextRefreshIn,
    pauseAutoRefresh,
    resumeAutoRefresh,
    isAutoRefreshPaused,
  } = useCombat();

  const router = useRouter();

  if (!combat || !combat.participants?.length)
    return <>Carregando combate...</>;

  const ordered = [...combat.participants].sort(
    (a, b) => a.turnOrder - b.turnOrder,
  );

  const activeParticipant = ordered[combat.currentTurnIndex];
  const activeCharacter = activeParticipant.character;

  const canAct = isMyTurn && !pendingReactionRoll && !actionUsed;

  const canUseActions = canAct;

  const canEndTurn = isMyTurn && !pendingReactionRoll;

  return (
    <Box
      sx={{
        height: "100vh",
        display: "grid",
        gridTemplateRows: "80px 1fr 0px",
        backgroundColor: "#0e0e1a",
        color: "#fff",
        overflow: "hidden",
      }}
    >
      <Head>
        <title>Tela de combate</title>
      </Head>
      {/* ================= HEADER ================= */}
      <Box
        sx={{
          borderBottom: "1px solid #333",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 3,
        }}
      >
        <Stack direction="row" spacing={3} alignItems="center">
          <Typography variant="h6">Round {combat.round}</Typography>

          <Typography fontSize={12} color="#aaa">
            Atualiza em {nextRefreshIn}s
          </Typography>

          <Button size="small" variant="outlined" onClick={refreshCombat}>
            Atualizar agora
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={isAutoRefreshPaused ? resumeAutoRefresh : pauseAutoRefresh}
          >
            {isAutoRefreshPaused ? "Retomar Auto-Update" : "Pausar Auto-Update"}
          </Button>
          {!isMaster && <DiceInputRoller characterId={myCharacterIds[0]} />}
        </Stack>

        {isMaster && (
          <Button
            color="error"
            variant="outlined"
            onClick={async () => {
              await api
                .post("/combat/control", {
                  action: "endCombat",
                  combatId: combat.id,
                })
                .finally(() => {
                  router.push("/protected/");
                });
            }}
          >
            Encerrar Combate
          </Button>
        )}
      </Box>

      {/* ================= CENTRO ================= */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "280px 1fr 400px",
          overflow: "hidden",
        }}
      >
        {/* ORDEM */}
        <Box
          sx={{
            p: 2,
            borderRight: "1px solid rgba(51, 51, 51, 0.6)",
            overflow: "auto",
            background:
              "linear-gradient(135deg, rgba(28, 28, 46, 0.4) 0%, rgba(14, 14, 26, 0.8) 100%)",
          }}
        >
          <Typography
            variant="h6"
            mb={2}
            sx={{ fontWeight: "bold", fontSize: "1.1rem", letterSpacing: 0.5 }}
          >
            Ordem de Turno
          </Typography>

          <Stack spacing={1.5}>
            {ordered.map((p, index) => {
              const isActive = index === combat.currentTurnIndex;
              const isTarget = selectedTargets.includes(p.character.id);

              return (
                <Card
                  key={p.id}
                  onClick={() =>
                    canAct &&
                    p.character.id !== activeCharacter.id &&
                    selectTarget(p.character.id)
                  }
                  sx={{
                    cursor:
                      canAct && p.character.id !== activeCharacter.id
                        ? "pointer"
                        : "default",
                    backgroundColor: isTarget
                      ? "rgba(239, 83, 80, 0.15)"
                      : isActive
                        ? "rgba(42, 42, 85, 0.8)"
                        : "rgba(28, 28, 46, 0.6)",
                    border: isActive
                      ? "2px solid #4fc3f7"
                      : isTarget
                        ? "2px solid #ef5350"
                        : "1px solid rgba(51, 51, 51, 0.8)",
                    boxShadow: isActive
                      ? "0 0 20px rgba(79, 195, 247, 0.8), inset 0 0 20px rgba(79, 195, 247, 0.1)"
                      : isTarget
                        ? "0 0 12px rgba(239, 83, 80, 0.6)"
                        : "0 2px 8px rgba(0, 0, 0, 0.5)",
                    opacity: p.character.life <= 0 ? 0.4 : 1,
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                    "&:hover": {
                      boxShadow: isActive
                        ? "0 0 20px rgba(79, 195, 247, 0.8), inset 0 0 20px rgba(79, 195, 247, 0.1)"
                        : isTarget
                          ? "0 0 16px rgba(239, 83, 80, 0.8)"
                          : canAct && p.character.id !== activeCharacter.id
                            ? "0 4px 16px rgba(107, 122, 219, 0.4)"
                            : "0 2px 8px rgba(0, 0, 0, 0.5)",
                      transform:
                        canAct && p.character.id !== activeCharacter.id
                          ? "translateY(-2px)"
                          : "none",
                    },
                  }}
                >
                  <CardContent>
                    <Typography>{p.character.name}</Typography>

                    <LinearProgress
                      value={(p.character.life / p.character.maxLife) * 100}
                      variant="determinate"
                      sx={{
                        mt: 1,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#333",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor:
                            p.character.life / p.character.maxLife > 0.6
                              ? "#66bb6a"
                              : p.character.life / p.character.maxLife > 0.3
                                ? "#ffa726"
                                : "#ef5350",
                        },
                      }}
                    />

                    <Typography fontSize={11} color="#aaa">
                      {p.character.life} / {p.character.maxLife} HP
                    </Typography>
                  </CardContent>
                </Card>
              );
            })}
          </Stack>
        </Box>

        {/* MAPA */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            border: "1px dashed rgba(107, 122, 219, 0.3)",
            borderRadius: 2,
            background:
              "radial-gradient(circle at center, #1a1a2e 0%, #0e0e1a 70%)",
          }}
        >
          <Typography color="#666">Campo de batalha</Typography>
        </Box>
        {/* LOG */}
        <Box
          sx={{
            p: 2,
            borderLeft: "1px solid rgba(17, 16, 16, 0.6)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background:
              "linear-gradient(135deg, rgba(14, 14, 26, 0.8) 0%, rgba(28, 28, 46, 0.4) 100%)",
          }}
        >
          <Typography
            variant="h6"
            mb={2}
            sx={{ fontWeight: "bold", fontSize: "1.1rem", letterSpacing: 0.5 }}
          >
            Log de Combate
          </Typography>
          <Box flex={1} overflow="auto">
            <CombatTimeline logs={combat.logs} />
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: "#333" }} />

      {/* ================= ACTION BAR ================= */}
      <Box
        sx={{
          p: 2,
          minHeight: 125,
          maxHeight: 180,
          overflow: "auto",
          borderTop: "2px solid rgba(107, 122, 219, 0.3)",
          background:
            "linear-gradient(90deg, rgba(28, 28, 46, 0.6) 0%, rgba(14, 14, 26, 0.8) 100%)",
        }}
      >
        <Stack spacing={2}>
          <Box
            sx={{ pb: 1, borderBottom: "1px solid rgba(107, 122, 219, 0.2)" }}
          >
            <Typography color="#8B9DFF" fontSize={14} fontWeight={500}>
              {pendingReactionRoll
                ? `⚠️ Você está sendo atacado por ${pendingReactionRoll.attackerName}`
                : `${activeCharacter.name} está avaliando o próximo movimento`}
            </Typography>

            {actionUsed && (
              <Typography fontSize={12} color="#ffa726" sx={{ mt: 0.5 }}>
                ⚡ Ação principal já utilizada neste turno
              </Typography>
            )}
          </Box>

          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            {activeCharacter.presets?.map((preset: ActionPresetType) => {
              const needsTarget = preset.targetType !== "SELF";

              if (
                preset.type === "TEST" ||
                preset.type === "SKILL" ||
                preset.type === "SUPPORT" ||
                preset.type === "REACT"
              )
                return null;

              return (
                <Button
                  key={preset.id}
                  variant={preset.requiresTurn ? "contained" : "outlined"}
                  color={preset.requiresTurn ? "primary" : "inherit"}
                  disabled={
                    !canUseActions ||
                    (preset.requiresTurn && actionUsed) ||
                    (needsTarget && selectedTargets.length === 0)
                  }
                  onClick={() =>
                    useMainAction({
                      presetId: preset.id,
                      targetIds: needsTarget ? selectedTargets : [],
                      characterId: activeCharacter.id,
                    })
                  }
                  sx={{
                    transition: "all 0.3s ease",
                    "&:hover:not(:disabled)": {
                      boxShadow: "0 0 12px rgba(107, 122, 219, 0.5)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  {preset.name}
                </Button>
              );
            })}

            <Button
              variant="outlined"
              disabled={!canEndTurn}
              onClick={async () => {
                await endTurn();
              }}
            >
              Passar Turno
            </Button>
          </Stack>

          {canAct &&
            selectedTargets.length === 0 &&
            activeCharacter.presets?.some(
              (p: ActionPresetType) => p.targetType !== "SELF",
            ) && (
              <Typography fontSize={12} color="#ff9800">
                Selecione um alvo ou passe a rodada.
              </Typography>
            )}
        </Stack>
      </Box>

      {/* ================= MODAL REAÇÃO ================= */}
      <Dialog open={Boolean(pendingReactionRoll)}>
        <DialogTitle sx={{ color: "#ffb74d" }}>
          ⚠️ {pendingReactionRoll?.attackerName} atacou você!
        </DialogTitle>

        <DialogContent>
          <Typography>Escolha rapidamente sua reação:</Typography>

          <Stack mt={2} spacing={1}>
            {pendingReactionRoll?.pendingReactionTargets?.map(
              (target: {
                id: string;
                blockPresetId: string | null;
                dodgePresetId: string | null;
                counterAttackPresetId: string | null;
              }) => (
                <Stack
                  key={target.id}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  {target.blockPresetId && (
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={() =>
                        resolveReaction(pendingReactionRoll.id, "BLOCK")
                      }
                    >
                      Bloquear
                    </Button>
                  )}

                  {target.dodgePresetId && (
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={() =>
                        resolveReaction(pendingReactionRoll.id, "DODGE")
                      }
                    >
                      Esquivar
                    </Button>
                  )}

                  {target.counterAttackPresetId && (
                    <Button
                      variant="contained"
                      color="warning"
                      onClick={() =>
                        resolveReaction(
                          pendingReactionRoll.id,
                          "COUNTER_ATTACK",
                        )
                      }
                    >
                      Contra-atacar
                    </Button>
                  )}
                  <Button
                    color="error"
                    onClick={() =>
                      resolveReaction(pendingReactionRoll.id, "SKIP")
                    }
                  >
                    Não reagir
                  </Button>
                </Stack>
              ),
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
