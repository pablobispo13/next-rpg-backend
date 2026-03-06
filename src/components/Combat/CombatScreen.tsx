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
import { useState } from "react";
import { DiceInputRoller } from "../DiceInputRoller";

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
    (a, b) => a.turnOrder - b.turnOrder
  );

  const activeParticipant = ordered[combat.currentTurnIndex];
  const activeCharacter = activeParticipant.character;

  const canAct =
    isMyTurn &&
    !pendingReactionRoll &&
    !actionUsed;

  const canUseActions = canAct;

  const canEndTurn =
    isMyTurn &&
    actionUsed &&
    !pendingReactionRoll;

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
          <Typography variant="h6">
            Round {combat.round}
          </Typography>

          <Typography fontSize={12} color="#aaa">
            Atualiza em {nextRefreshIn}s
          </Typography>

          <Button
            size="small"
            variant="outlined"
            onClick={refreshCombat}
          >
            Atualizar agora
          </Button>
          <Button
            size="small"
            variant="outlined"
            onClick={
              isAutoRefreshPaused
                ? resumeAutoRefresh
                : pauseAutoRefresh
            }
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
              await api.post("/combat/control", {
                action: "endCombat",
                combatId: combat.id,
              }).finally(() => {
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
          gridTemplateColumns: "260px 1fr 400px",
          overflow: "hidden",
        }}
      >
        {/* ORDEM */}
        <Box
          sx={{
            p: 2,
            borderRight: "1px solid #333",
            overflow: "auto",
          }}
        >
          <Typography variant="h6" mb={2}>
            Ordem
          </Typography>

          <Stack spacing={2}>
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
                    cursor: canAct ? "pointer" : "default",
                    backgroundColor: isTarget
                      ? "#5a1f1f"
                      : isActive
                        ? "#2a2a55"
                        : "#1c1c2e",
                    border: isActive
                      ? "2px solid #4fc3f7"
                      : isTarget
                        ? "2px solid #ef5350"
                        : "1px solid #333",
                    boxShadow: isActive
                      ? "0 0 12px rgba(79,195,247,0.6)"
                      : "none",
                    opacity: p.character.life <= 0 ? 0.5 : 1,
                    transition: "all 0.2s ease",
                  }}
                >
                  <CardContent>
                    <Typography>
                      {p.character.name}
                    </Typography>

                    <LinearProgress
                      value={
                        (p.character.life /
                          p.character.maxLife) *
                        100
                      }
                      variant="determinate"
                      sx={{
                        mt: 1,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: "#333",
                        "& .MuiLinearProgress-bar": {
                          backgroundColor:
                            p.character.life /
                              p.character.maxLife >
                              0.6
                              ? "#66bb6a"
                              : p.character.life /
                                p.character.maxLife >
                                0.3
                                ? "#ffa726"
                                : "#ef5350",
                        },
                      }}
                    />

                    <Typography fontSize={11} color="#aaa">
                      {p.character.life} /{" "}
                      {p.character.maxLife} HP
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
            border: "1px dashed #333",
            borderRadius: 2,
            background:
              "radial-gradient(circle at center, #1a1a2e 0%, #0e0e1a 70%)",
          }}
        >
          <Typography color="#666">
            Campo de batalha
          </Typography>
        </Box>

        {/* LOG */}
        <Box
          sx={{
            p: 2,
            borderLeft: "1px solid #333",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
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
          maxHeight: 160,
          overflow: "auto",
        }}
      >
        <Stack spacing={1}>
          <Typography color="#aaa" fontSize={14}>
            {pendingReactionRoll
              ? `Você está sendo atacado por ${pendingReactionRoll.attackerName}`
              : `${activeCharacter.name} está avaliando o próximo movimento`}
          </Typography>

          {actionUsed && (
            <Typography fontSize={12} color="#ef5350">
              Ação principal já utilizada neste turno
            </Typography>
          )}

          {!actionUsed && canAct && (
            <Typography fontSize={12} color="#ff9800">
              Você deve usar uma ação principal antes de passar o turno
            </Typography>
          )}

          <Stack direction="row" spacing={2} flexWrap="wrap">
            {activeCharacter.presets?.map(
              (preset: ActionPresetType) => {
                const needsTarget =
                  preset.targetType !== "SELF";

                if (
                  preset.type === "TEST" ||
                  preset.type === "REACT"
                )
                  return null;

                return (
                  <Button
                    key={preset.id}
                    variant={
                      preset.requiresTurn
                        ? "contained"
                        : "outlined"
                    }
                    color={
                      preset.requiresTurn
                        ? "primary"
                        : "inherit"
                    }
                    disabled={
                      !canUseActions ||
                      (preset.requiresTurn &&
                        actionUsed) ||
                      (needsTarget &&
                        selectedTargets.length === 0)
                    }
                    onClick={() =>
                      useMainAction({
                        presetId: preset.id,
                        targetIds: needsTarget
                          ? selectedTargets
                          : [],
                        characterId:
                          activeCharacter.id,
                      })
                    }
                  >
                    {preset.name}
                  </Button>
                );
              }
            )}

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
              (p: ActionPresetType) =>
                p.targetType !== "SELF"
            ) && (
              <Typography fontSize={12} color="#ff9800">
                Selecione um alvo
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
          <Typography>
            Escolha rapidamente sua reação:
          </Typography>

          <Stack mt={2} spacing={1}>
            {pendingReactionRoll?.pendingReactionTargets?.map(
              (target: any) => (
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
                        resolveReaction(
                          pendingReactionRoll.id,
                          "BLOCK"
                        )
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
                        resolveReaction(
                          pendingReactionRoll.id,
                          "DODGE"
                        )
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
                          "COUNTER_ATTACK"
                        )
                      }
                    >
                      Contra-atacar
                    </Button>
                  )}
                  <Button
                    color="error"
                    onClick={() => resolveReaction(pendingReactionRoll.id, "SKIP")}
                  >
                    Não reagir
                  </Button>
                </Stack>
              )
            )}
          </Stack>
        </DialogContent>
      </Dialog>
    </Box>
  );
}