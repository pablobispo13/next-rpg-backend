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
    selectedTargets,
    selectTarget,
    useMainAction,
    endTurn,
    pendingReactionRoll,
    resolveReaction,
    refreshCombat,
    nextRefreshIn,
  } = useCombat();

  if (!combat || !combat.participants?.length) return <>Carregando combate...</>;
  const [endingTurn, setEndingTurn] = useState<boolean>(false);
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


  const router = useRouter();
  return (
    <Box
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0e0e1a",
        color: "#fff",
        overflow: "hidden", // CRÍTICO
      }}
    >
      {/* HEADER */}
      <Box p={2} borderBottom="1px solid #333">
        <Stack direction="row" overflow="hidden" justifyContent="space-between">
          <Typography variant="h6">Round {combat.round}
            <Stack direction="row" spacing={2} alignItems="center">
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
            </Stack></Typography>
          {isMaster && (
            <Button
              color="error"
              variant="outlined"
              onClick={async () => {
                await api.post("/combat/control", {
                  action: "endCombat",
                  combatId: combat.id,
                }).finally(() => {
                  router.push("/protected/")
                });
              }}
            >
              Encerrar Combate
            </Button>
          )}
        </Stack>
      </Box>

      {/* TURNOS */}
      <Stack direction="row" height="calc(100% - 20%)">
        <Box
          width={260}
          p={2}
          borderRight="1px solid #333"
          overflow="auto"
        >
          <Typography variant="h6" mb={2}>Ordem</Typography>
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
                    boxShadow: isActive ? "0 0 12px rgba(79,195,247,0.6)" : "none",
                    opacity: p.character.life <= 0 ? 0.5 : 1,
                    transition: "all 0.2s ease",
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

        <Box
          flex={1}
          p={2}
          display="flex"
          alignItems="center"
          justifyContent="center"
          sx={{
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
          p={2}
          borderLeft="1px solid #333"
          display="flex"
          flexDirection="column"
        >
          <Box flex={1} overflow="auto">
            <CombatTimeline logs={combat.logs} />
          </Box>
        </Box>
      </Stack>

      <Divider sx={{ borderColor: "#333" }} />

      {/* ACTION BAR */}
      <Box p={2}>
        <Stack spacing={1}>
          <Typography color="#aaa" fontSize={14}>
            {pendingReactionRoll
              ? `Você está sendo atacado por ${pendingReactionRoll.attackerName}`
              : `${activeCharacter.name} está avaliando o próximo movimento`}
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
          </Typography>

          <Stack direction="row" spacing={2}>
            {activeCharacter.presets?.map((preset: ActionPresetType) => {
              const needsTarget = preset.targetType !== "SELF";
              if (preset.type !== "TEST" && preset.type !== "REACT")
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
                  >
                    {preset.name}
                  </Button>
                )
            })}
            <Button
              variant="outlined"
              disabled={!canEndTurn}
              onClick={async () => {
                try {
                  setEndingTurn(true);
                  await endTurn();
                } finally {
                  setEndingTurn(false);
                }
              }}
            >
              Passar Turno
            </Button>
          </Stack>


          {canAct &&
            selectedTargets.length === 0 &&
            activeCharacter.presets?.some((p: ActionPresetType) => p.targetType !== "SELF") && (
              <Typography fontSize={12} color="#ff9800">
                Selecione um alvo
              </Typography>
            )}
        </Stack>
      </Box>

      {/* MODAL DE REAÇÃO */}
      <Dialog open={Boolean(pendingReactionRoll)}>
        <DialogTitle sx={{ color: "#ffb74d" }}>
          ⚠️ {pendingReactionRoll?.attackerName} atacou você!
        </DialogTitle>

        <DialogContent>
          <Typography>
            Escolha rapidamente sua reação:
          </Typography>
          <Stack mt={2} spacing={1}>
            {pendingReactionRoll?.pendingReactionTargets?.map((target: any) => (/* eslint-disable  @typescript-eslint/no-explicit-any */
              <Stack key={target.id} direction="row" spacing={1} alignItems="center">
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
                      resolveReaction(pendingReactionRoll.id, "COUNTER_ATTACK")
                    }
                  >
                    Contra-atacar
                  </Button>
                )}
              </Stack>
            ))}
          </Stack>
        </DialogContent>
      </Dialog>
    </Box >
  );
}
