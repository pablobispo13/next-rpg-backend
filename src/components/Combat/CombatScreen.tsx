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
  DialogActions,
  Chip,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  IconButton,
  TextField,
  Tooltip,
  Avatar,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import { useAuth } from "../../context/AuthContext";
import { useCombat, CombatProvider } from "../../context/CombatContext";
import api from "../../lib/api";
import { useRouter } from "next/router";
import { ActionPresetType } from "../../types/types";
import { CombatTimelineV2 } from "../Log/CombatTimelineV2";
import { parseEmbedUrl } from "../Stream/StreamPiP";
import { DiceInputRoller } from "../DiceInputRoller";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useActiveStream } from "../../lib/useActiveStream";
import { Reorder, motion, AnimatePresence } from "framer-motion";

/* =========================
   HELPERS
========================= */

type HpTier = { label: string; color: string; bgColor: string };

function getHpTier(currentLife: number, maxLife: number): HpTier {
  if (currentLife <= 0) return { label: "Morto", color: "#666", bgColor: "#66666620" };
  const pct = maxLife > 0 ? currentLife / maxLife : 0;
  if (pct > 0.75) return { label: "Saudável", color: "#66bb6a", bgColor: "#66bb6a20" };
  if (pct > 0.5) return { label: "Levem. Ferido", color: "#8bc34a", bgColor: "#8bc34a20" };
  if (pct > 0.25) return { label: "Ferido", color: "#ffa726", bgColor: "#ffa72620" };
  return { label: "Crítico", color: "#ef5350", bgColor: "#ef535020" };
}

function parseDiceAverage(formula: string): number {
  if (!formula) return 0;
  let total = 0;
  const withAverages = formula.replace(/(\d+)d(\d+)/gi, (_, n, m) =>
    String(parseInt(n) * (parseInt(m) + 1) / 2)
  );
  const numPattern = /([+-]?\s*\d+(?:\.\d+)?)/g;
  let match;
  while ((match = numPattern.exec(withAverages)) !== null) {
    total += parseFloat(match[1].replace(/\s/g, ""));
  }
  return Math.round(total * 10) / 10;
}

const ATTR_LABEL: Record<string, string> = {
  STRENGTH: "Força",
  AGILITY: "Agilidade",
  VIGOR: "Vigor",
  INTELLECT: "Intelecto",
  PRESENCE: "Presença",
};

function presetTooltipContent(preset: ActionPresetType) {
  const avgAttack = parseDiceAverage(preset.diceFormula);
  const avgDamage = preset.impactFormula ? parseDiceAverage(preset.impactFormula) : null;
  const avgCrit =
    avgDamage && preset.critMultiplier
      ? Math.round(avgDamage * preset.critMultiplier * 10) / 10
      : null;
  const attrLabel = ATTR_LABEL[preset.attribute] ?? preset.attribute;

  return (
    <Box sx={{ p: 0.5, maxWidth: 260 }}>
      <Typography fontWeight="bold" fontSize={13} mb={0.5}>{preset.name}</Typography>
      {preset.description && (
        <Typography fontSize={11} color="#ccc" mb={1} sx={{ whiteSpace: "pre-wrap", fontStyle: "italic" }}>
          {preset.description}
        </Typography>
      )}

      <Divider sx={{ borderColor: "#ffffff20", my: 0.75 }} />

      <Stack spacing={0.4}>
        <Row label="Tipo" value={preset.type} />
        <Row label="Alvo" value={preset.targetType} />
        <Row label="Atributo" value={attrLabel} highlight />

        <Divider sx={{ borderColor: "#ffffff15", my: 0.5 }} />

        <Typography fontSize={11} color="#fbbf24" fontWeight={600}>Rolagem de Ataque</Typography>
        <Row label="Dado" value={`${preset.diceFormula}  (média ${avgAttack})`} />
        {!!preset.modifier && (
          <Row label="Modificador" value={`${preset.modifier > 0 ? "+" : ""}${preset.modifier}`} />
        )}
        <Row
          label="Total médio"
          value={`~${avgAttack + (preset.modifier ?? 0)} + ${attrLabel}`}
          highlight
        />

        {avgDamage !== null && (
          <>
            <Divider sx={{ borderColor: "#ffffff15", my: 0.5 }} />
            <Typography fontSize={11} color="#f87171" fontWeight={600}>Impacto</Typography>
            <Row label="Fórmula" value={`${preset.impactFormula}  (média ${avgDamage})`} />
            <Row label="Dano médio" value={`~${avgDamage} + ${attrLabel}`} highlight />
            {avgCrit && (
              <Row
                label={`Crítico ×${preset.critMultiplier}`}
                value={`~${avgCrit} + ${attrLabel}`}
                danger
              />
            )}
          </>
        )}

        {(preset.critThreshold ?? 20) < 20 && (
          <>
            <Divider sx={{ borderColor: "#ffffff15", my: 0.5 }} />
            <Row label="Crítico em" value={`≥ ${preset.critThreshold ?? 20}`} danger />
          </>
        )}

        <Divider sx={{ borderColor: "#ffffff15", my: 0.5 }} />
        <Typography fontSize={10} color="#9ca3af">
          {preset.requiresTurn ? "⚡ Consome turno" : "✓ Ação livre"}{" "}
          {preset.allowOutOfCombat ? "• ✓ Fora de combate" : ""}{" "}
          {preset.isAreaEffect ? "• 🌐 Área" : ""}
        </Typography>
      </Stack>
    </Box>
  );
}

function Row({ label, value, highlight, danger }: { label: string; value: string; highlight?: boolean; danger?: boolean }) {
  return (
    <Stack direction="row" justifyContent="space-between" spacing={1}>
      <Typography fontSize={11} color="#9ca3af">{label}</Typography>
      <Typography fontSize={11} color={danger ? "#f87171" : highlight ? "#a78bfa" : "#e5e7eb"} fontWeight={highlight || danger ? 600 : 400}>
        {value}
      </Typography>
    </Stack>
  );
}

/* =========================
   ROOT
========================= */

type CombatScreenProps = { combatId: string };

export default function CombatScreen({ combatId }: CombatScreenProps) {
  const { user } = useAuth();
  return (
    <CombatProvider combatId={combatId}>
      <CombatScreenContent isMaster={user?.role === "MESTRE"} />
    </CombatProvider>
  );
}

/* =========================
   CONTENT
========================= */

function CombatScreenContent({ isMaster }: { isMaster: boolean }) {
  const {
    combat, isMyTurn, actionUsed, myCharacterIds, selectedTargets,
    selectTarget, useMainAction, endTurn, endCombat, pendingReactionRoll,
    resolveReaction, refreshCombat, nextRefreshIn,
    pauseAutoRefresh, resumeAutoRefresh, isAutoRefreshPaused,
    isLoading, combatStats, clearStats,
  } = useCombat();

  const router = useRouter();

  // Add participant
  const [addParticipantOpen, setAddParticipantOpen] = useState(false);
  const [availableChars, setAvailableChars] = useState<any[]>([]);
  const [loadingChars, setLoadingChars] = useState(false);

  // Manual HP edit
  const [hpEditOpen, setHpEditOpen] = useState(false);
  const [hpEditParticipant, setHpEditParticipant] = useState<any>(null);
  const [hpEditValue, setHpEditValue] = useState<number>(0);

  // Drag-and-drop order
  const [orderedParticipants, setOrderedParticipants] = useState<any[]>([]);
  const draggedRef = useRef(false);

  // Floating damage numbers
  const prevLifeRef = useRef<Record<string, number>>({});
  const [floatingDamages, setFloatingDamages] = useState<Record<string, { id: number; delta: number; isHeal: boolean }[]>>({});

  // Fullscreen battlefield
  const [battleFullscreen, setBattleFullscreen] = useState(false);
  const battleIframeRef = useRef<HTMLIFrameElement>(null);

  function handleBattleFullscreen() {
    if (battleIframeRef.current?.requestFullscreen) {
      battleIframeRef.current.requestFullscreen();
    } else {
      setBattleFullscreen(true); // fallback para navegadores sem suporte
    }
  }

  const streamUrl = useActiveStream(15000);

  // Combat notes (master only)
  const [notesValue, setNotesValue] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);

  useEffect(() => {
    if (combat?.notes !== undefined) setNotesValue(combat.notes ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [combat?.id]);

  // Redireciona jogadores automaticamente quando o combate é encerrado
  useEffect(() => {
    if (combat?.active === false && !isMaster) {
      toast.info("O combate foi encerrado pelo mestre.");
      router.push("/protected/");
    }
  }, [combat?.active]);

  async function saveNotes() {
    setNotesSaving(true);
    try {
      await api.post("/combat/control", { action: "updateNotes", combatId: combat.id, notes: notesValue });
    } finally {
      setNotesSaving(false);
    }
  }


  /* ---- sync ordered list ---- */
  useEffect(() => {
    if (!combat) return;
    const sorted = [...combat.participants].sort((a: any, b: any) => a.turnOrder - b.turnOrder);
    setOrderedParticipants(sorted);
  }, [combat?.participants]);

  /* ---- detect HP changes for floating numbers ---- */
  const livesKey = combat?.participants?.map((p: any) => `${p.character.id}:${p.currentLife}`).join(",") ?? "";

  useEffect(() => {
    if (!combat?.participants) return;
    const events: Record<string, { id: number; delta: number; isHeal: boolean }> = {};

    for (const p of combat.participants as any[]) {
      const prev = prevLifeRef.current[p.character.id];
      if (prev !== undefined && p.currentLife !== prev) {
        const delta = Math.abs(p.currentLife - prev);
        events[p.character.id] = { id: Date.now() + Math.random(), delta, isHeal: p.currentLife > prev };
      }
      prevLifeRef.current[p.character.id] = p.currentLife;
    }

    if (Object.keys(events).length === 0) return;

    setFloatingDamages((prev) => {
      const next = { ...prev };
      for (const [charId, ev] of Object.entries(events)) {
        next[charId] = [...(prev[charId] ?? []), ev];
      }
      return next;
    });

    const toRemove = Object.entries(events).map(([charId, ev]) => ({ charId, id: ev.id }));
    setTimeout(() => {
      setFloatingDamages((prev) => {
        const next = { ...prev };
        for (const { charId, id } of toRemove) {
          next[charId] = (prev[charId] ?? []).filter((x) => x.id !== id);
        }
        return next;
      });
    }, 1800);
  }, [livesKey]);

  /* ---- turn notification ---- */
  useEffect(() => {
    if (!combat) return;
    if (isMyTurn && !pendingReactionRoll) {
      document.title = "⚔️ SEU TURNO! — Combate";
      if (typeof window !== "undefined" && "Notification" in window) {
        if (Notification.permission === "granted") {
          new Notification("É o seu turno!", { body: "Clique para agir no combate." });
        } else if (Notification.permission === "default") {
          Notification.requestPermission();
        }
      }
    } else {
      document.title = "Tela de combate";
    }
    return () => { document.title = "Tela de combate"; };
  }, [isMyTurn, pendingReactionRoll]);

  async function openAddParticipant() {
    setAddParticipantOpen(true);
    setLoadingChars(true);
    try {
      const res = await api.get("/characters");
      const existingIds = new Set(combat?.participants.map((p: any) => p.character.id));
      setAvailableChars((res.data.characters ?? res.data).filter((c: any) => !existingIds.has(c.id)));
    } catch { setAvailableChars([]); }
    finally { setLoadingChars(false); }
  }

  async function addParticipant(characterId: string) {
    await api.post("/combat/participants", { combatId: combat.id, characterId });
    setAddParticipantOpen(false);
    await refreshCombat();
  }

  async function submitHpEdit() {
    if (!hpEditParticipant) return;
    await api.post("/combat/control", {
      action: "adjustHp", combatId: combat.id,
      characterId: hpEditParticipant.character.id, newHp: hpEditValue,
    });
    setHpEditOpen(false);
    setHpEditParticipant(null);
    await refreshCombat();
  }

  async function handleReorderEnd() {
    if (!draggedRef.current || !isMaster) return;
    draggedRef.current = false;
    await api.post("/combat/control", {
      action: "reorderTurns", combatId: combat.id,
      order: orderedParticipants.map((p: any, i: number) => ({ participantId: p.id, turnOrder: i })),
    });
    await refreshCombat();
  }

  function exportLog() {
    if (!combat) return;
    const lines = combat.logs.map((l: any) => `[${l.type}] ${l.message}`).join("\n");
    const blob = new Blob([`=== Combate ${combat.id} — Round ${combat.round} ===\n\n${lines}`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `combate-${combat.id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!combat || !combat.participants?.length) return <>Carregando combate...</>;

  const ordered = [...combat.participants].sort((a: any, b: any) => a.turnOrder - b.turnOrder);
  const activeParticipant = ordered[combat.currentTurnIndex];
  const activeCharacter = activeParticipant.character;
  const myParticipant = ordered.find((p: any) => myCharacterIds.includes(p.character.id));
  const presetsSource = isMaster ? activeCharacter : (myParticipant?.character ?? activeCharacter);
  const canAct = isMyTurn && !pendingReactionRoll && !actionUsed;
  const canEndTurn = isMyTurn && !pendingReactionRoll;

  return (
    <Box sx={{ height: "100vh", display: "grid", gridTemplateRows: "80px 1fr 0px", backgroundColor: "#0e0e1a", color: "#fff", overflow: "hidden" }}>
      <Head><title>Tela de combate</title></Head>

      {/* ===== HEADER ===== */}
      <Box sx={{ borderBottom: "1px solid #333", display: "flex", alignItems: "center", justifyContent: "space-between", px: 3 }}>
        <Stack direction="row" spacing={3} alignItems="center">
          <Typography variant="h6">Round {combat.round}</Typography>
          <Typography fontSize={12} color="#aaa">Atualiza em {nextRefreshIn}s</Typography>
          <Button size="small" variant="outlined" onClick={refreshCombat}>Atualizar agora</Button>
          <Button size="small" variant="outlined" onClick={isAutoRefreshPaused ? resumeAutoRefresh : pauseAutoRefresh}>
            {isAutoRefreshPaused ? "Retomar Auto-Update" : "Pausar Auto-Update"}
          </Button>
          {!isMaster && <DiceInputRoller characterId={myCharacterIds[0]} />}
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          {isMaster && (
            <Tooltip title="Exportar log">
              <IconButton size="small" onClick={exportLog} sx={{ color: "#aaa" }}>
                <FileDownloadIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {isMaster && (
            <Button size="small" variant="outlined" color="secondary" onClick={openAddParticipant}>
              + Adicionar Personagem
            </Button>
          )}
          {isMaster && (
            <Button color="error" variant="outlined" disabled={isLoading} onClick={endCombat}>
              {isLoading ? <CircularProgress size={14} sx={{ mr: 0.5 }} /> : null}
              Encerrar Combate
            </Button>
          )}
        </Stack>
      </Box>

      {/* ===== CENTRO ===== */}
      <Box sx={{ display: "grid", gridTemplateColumns: "280px 1fr 400px", overflow: "hidden" }}>

        {/* ORDEM DE TURNO */}
        <Box sx={{ p: 2, borderRight: "1px solid rgba(51,51,51,0.6)", overflow: "auto", background: "linear-gradient(135deg, rgba(28,28,46,0.4) 0%, rgba(14,14,26,0.8) 100%)" }}>
          <Typography variant="h6" mb={2} sx={{ fontWeight: "bold", fontSize: "1.1rem", letterSpacing: 0.5 }}>
            Ordem de Turno
            {isMaster && <Typography component="span" fontSize={10} color="#666" ml={1}>(arraste para reordenar)</Typography>}
          </Typography>

          <Reorder.Group axis="y" values={orderedParticipants} onReorder={(v) => { if (isMaster) { draggedRef.current = true; setOrderedParticipants(v); } }} style={{ padding: 0, margin: 0, listStyle: "none" }} as="div">
            <Stack spacing={1.5}>
              {orderedParticipants.map((p: any, index: number) => {
                const isActive = p.turnOrder === combat.currentTurnIndex;
                const isTarget = selectedTargets.includes(p.character.id);
                const isNpc = p.character.owner?.role === "MESTRE";
                const showExactHp = isMaster || !isNpc;
                const tier = getHpTier(p.currentLife, p.character.maxLife);
                const hpPct = p.character.maxLife > 0 ? (p.currentLife / p.character.maxLife) * 100 : 0;
                const floating = floatingDamages[p.character.id] ?? [];

                return (
                  <Reorder.Item
                    key={p.id}
                    value={p}
                    as="div"
                    dragListener={isMaster}
                    onDragEnd={handleReorderEnd}
                    animate={isActive ? {
                      boxShadow: ["0 0 18px rgba(79,195,247,0.5)", "0 0 32px rgba(79,195,247,0.95)", "0 0 18px rgba(79,195,247,0.5)"],
                    } : { boxShadow: "0 2px 8px rgba(0,0,0,0.5)" }}
                    transition={isActive ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
                    style={{ borderRadius: 8, cursor: isMaster ? "grab" : "default", position: "relative" }}
                  >
                    {/* Floating damage/heal numbers */}
                    <AnimatePresence>
                      {floating.map((ev) => (
                        <motion.div
                          key={ev.id}
                          initial={{ opacity: 1, y: 0, x: "50%" }}
                          animate={{ opacity: 0, y: -48 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1.6, ease: "easeOut" }}
                          style={{
                            position: "absolute",
                            top: 4,
                            right: 8,
                            zIndex: 20,
                            pointerEvents: "none",
                            fontWeight: 800,
                            fontSize: 18,
                            color: ev.isHeal ? "#4ade80" : "#f87171",
                            textShadow: ev.isHeal ? "0 0 8px #4ade80" : "0 0 8px #f87171",
                          }}
                        >
                          {ev.isHeal ? "+" : "-"}{ev.delta}
                        </motion.div>
                      ))}
                    </AnimatePresence>

                    <Card
                      onClick={() => canAct && p.character.id !== activeCharacter.id && selectTarget(p.character.id)}
                      sx={{
                        cursor: canAct && p.character.id !== activeCharacter.id ? "pointer" : isMaster ? "grab" : "default",
                        backgroundColor: isTarget ? "rgba(239,83,80,0.15)" : isActive ? "rgba(42,42,85,0.8)" : "rgba(28,28,46,0.6)",
                        border: isActive ? "2px solid #4fc3f7" : isTarget ? "2px solid #ef5350" : "1px solid rgba(51,51,51,0.8)",
                        opacity: p.currentLife <= 0 ? 0.45 : 1,
                        transition: "background 0.3s, border 0.3s, opacity 0.3s",
                      }}
                    >
                      <CardContent sx={{ pb: "12px !important", px: 1.5 }}>
                        {/* Header row: index + avatar + name + badges */}
                        <Stack direction="row" alignItems="center" spacing={1} mb={0.75}>
                          <Typography fontSize={10} color="#555" fontWeight={700} sx={{ minWidth: 14 }}>#{index + 1}</Typography>

                          <Avatar
                            src={p.character.image ?? undefined}
                            alt={p.character.name}
                            sx={{ width: 28, height: 28, fontSize: 11, bgcolor: isActive ? "#4fc3f7" : "#374151", border: isActive ? "2px solid #4fc3f7" : "1px solid #555" }}
                          >
                            {p.character.name[0]}
                          </Avatar>

                          <Typography fontSize={13} fontWeight={600} flex={1} noWrap>{p.character.name}</Typography>

                          <Stack direction="row" alignItems="center" spacing={0.25}>
                            {isNpc && <Chip label="NPC" size="small" sx={{ fontSize: 9, height: 16, bgcolor: "#374151", color: "#9ca3af" }} />}
                            {isMaster && (
                              <IconButton size="small" sx={{ p: 0.25 }} onClick={(e) => { e.stopPropagation(); setHpEditParticipant(p); setHpEditValue(p.currentLife); setHpEditOpen(true); }}>
                                <EditIcon sx={{ fontSize: 13, color: "#666" }} />
                              </IconButton>
                            )}
                          </Stack>
                        </Stack>

                        {/* HP */}
                        {showExactHp ? (
                          <>
                            <LinearProgress value={hpPct} variant="determinate" sx={{ height: 7, borderRadius: 4, bgcolor: "#333", "& .MuiLinearProgress-bar": { bgcolor: tier.color, transition: "width 0.6s ease" } }} />
                            <Typography fontSize={11} color="#aaa" mt={0.5}>{p.currentLife} / {p.character.maxLife} HP</Typography>
                          </>
                        ) : (
                          <Box mt={0.75} sx={{ px: 1.5, py: 0.4, borderRadius: 1, bgcolor: tier.bgColor, border: `1px solid ${tier.color}40`, display: "inline-block" }}>
                            <Typography fontSize={11} color={tier.color} fontWeight={600}>{tier.label}</Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Reorder.Item>
                );
              })}
            </Stack>
          </Reorder.Group>
        </Box>

        {/* CAMPO DE BATALHA */}
        <Box sx={{ display: "flex", flexDirection: "column", overflow: "hidden", border: "1px solid rgba(107,122,219,0.2)", background: "radial-gradient(circle at center, #1a1a2e 0%, #0e0e1a 70%)", position: "relative" }}>
          {/* Barra de título */}
          <Box sx={{ px: 1.5, py: 0.75, borderBottom: "1px solid rgba(107,122,219,0.15)", display: "flex", alignItems: "center", gap: 1, backgroundColor: "rgba(14,14,26,0.8)", flexShrink: 0 }}>
            <Typography fontSize={11} color={streamUrl ? "#4ade80" : "#555"} sx={{ flex: 1 }}>
              {streamUrl ? "🔴 Stream ativa" : "Campo de batalha"}
            </Typography>
            <Tooltip title="Tela cheia">
              <IconButton onClick={handleBattleFullscreen} sx={{ color: "#444", "&:hover": { color: "#aaa" } }}>
                <FullscreenIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Conteúdo: stream ou placeholder */}
          <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden" }}>
            {streamUrl && parseEmbedUrl(streamUrl) ? (
              <iframe
                ref={battleIframeRef}
                src={parseEmbedUrl(streamUrl)!}
                style={{ width: "100%", height: "100%", border: "none" }}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <Typography color="#333" fontSize={12} textAlign="center">
                {isMaster ? "Configure a stream na tela inicial" : "Aguardando stream do mestre…"}
              </Typography>
            )}
          </Box>
        </Box>

        {/* LOG */}
        <Box sx={{ p: 2, borderLeft: "1px solid rgba(17,16,16,0.6)", display: "flex", flexDirection: "column", overflow: "hidden", background: "linear-gradient(135deg, rgba(14,14,26,0.8) 0%, rgba(28,28,46,0.4) 100%)" }}>
          <Box flex={1} overflow="auto">
            <CombatTimelineV2 logs={combat.logs ?? []} />
          </Box>
        </Box>
      </Box>

      <Divider sx={{ borderColor: "#333" }} />

      {/* ===== ACTION BAR ===== */}
      <Box sx={{ p: 2, minHeight: 125, maxHeight: 180, overflow: "auto", borderTop: isMyTurn && !pendingReactionRoll ? "2px solid rgba(79,195,247,0.8)" : "2px solid rgba(107,122,219,0.3)", background: isMyTurn && !pendingReactionRoll ? "linear-gradient(90deg, rgba(79,195,247,0.08) 0%, rgba(14,14,26,0.8) 100%)" : "linear-gradient(90deg, rgba(28,28,46,0.6) 0%, rgba(14,14,26,0.8) 100%)", transition: "border-color 0.4s, background 0.4s" }}>
        <Stack spacing={2}>
          <Box sx={{ pb: 1, borderBottom: "1px solid rgba(107,122,219,0.2)" }}>
            <Typography color={isMyTurn && !pendingReactionRoll ? "#4fc3f7" : "#8B9DFF"} fontSize={14} fontWeight={500}>
              {pendingReactionRoll ? `⚠️ Você está sendo atacado por ${pendingReactionRoll.attackerName}` : isMyTurn ? `⚔️ ${activeCharacter.name} — É o SEU TURNO!` : `Aguardando o turno de ${activeCharacter.name}...`}
            </Typography>
            {actionUsed && <Typography fontSize={12} color="#ffa726" mt={0.5}>⚡ Ação principal já utilizada neste turno</Typography>}
            {!isMyTurn && !isMaster && myParticipant && <Typography fontSize={11} color="#6b7280" mt={0.5}>Suas habilidades — disponíveis no seu turno</Typography>}
          </Box>

          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            {presetsSource.presets?.map((preset: ActionPresetType & { isAreaEffect?: boolean }) => {
              const needsTarget = preset.targetType !== "SELF";
              const isAoe = preset.isAreaEffect || preset.targetType === "MULTIPLE";
              if (["TEST", "SKILL", "REACT"].includes(preset.type)) return null;

              return (
                <Tooltip
                  key={preset.id}
                  title={presetTooltipContent(preset)}
                  placement="top"
                  arrow
                  componentsProps={{ tooltip: { sx: { backgroundColor: "#1a1a2e", border: "1px solid rgba(107,122,219,0.4)", maxWidth: 280 } } }}
                >
                  <Box sx={{ position: "relative" }}>
                    <Button
                      variant={preset.requiresTurn ? "contained" : "outlined"}
                      color={preset.requiresTurn ? "primary" : "inherit"}
                      disabled={!canAct || isLoading || (preset.requiresTurn && actionUsed) || (needsTarget && selectedTargets.length === 0)}
                      onClick={() => useMainAction({ presetId: preset.id, targetIds: needsTarget ? selectedTargets : [], characterId: activeCharacter.id })}
                      sx={{ transition: "all 0.3s", pr: isAoe ? 4 : undefined, "&:hover:not(:disabled)": { boxShadow: "0 0 12px rgba(107,122,219,0.5)", transform: "translateY(-2px)" } }}
                    >
                      {preset.name}
                    </Button>
                    {isAoe && (
                      <Chip label="Área" size="small" sx={{ position: "absolute", top: -8, right: -8, height: 16, fontSize: 9, bgcolor: "#7c3aed", color: "#fff", pointerEvents: "none" }} />
                    )}
                  </Box>
                </Tooltip>
              );
            })}

            {isMyTurn && (
              <Button variant="outlined" disabled={!canEndTurn || isLoading} onClick={endTurn}>
                {isLoading ? <CircularProgress size={14} sx={{ mr: 0.5 }} /> : null}
                Passar Turno
              </Button>
            )}
          </Stack>

          {canAct && selectedTargets.length === 0 && presetsSource.presets?.some((p: ActionPresetType) => p.targetType !== "SELF") && (
            <Typography fontSize={12} color="#ff9800">Selecione um alvo ou passe a rodada.</Typography>
          )}
          {canAct && selectedTargets.length > 1 && (
            <Typography fontSize={12} color="#a78bfa">🎯 {selectedTargets.length} alvos selecionados — ataque em múltiplos inimigos</Typography>
          )}
        </Stack>
      </Box>

      {/* ===== MODAL REAÇÃO ===== */}
      <Dialog open={Boolean(pendingReactionRoll)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: "#ffb74d", pb: 1 }}>
          ⚠️ Reação de Ataque ({pendingReactionRoll?.currentTargetIndex} de {pendingReactionRoll?.totalTargets})
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Box sx={{ textAlign: "center", py: 1 }}>
              <Typography variant="h6">{pendingReactionRoll?.attackerName} atacou {pendingReactionRoll?.currentReactionTarget?.name}!</Typography>
            </Box>
            <LinearProgress variant="determinate" value={((pendingReactionRoll?.currentTargetIndex ?? 0) / (pendingReactionRoll?.totalTargets ?? 1)) * 100} sx={{ height: 8, borderRadius: 1 }} />
            <Typography variant="body2" color="text.secondary">Escolha sua reação:</Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {pendingReactionRoll?.currentReactionTarget?.blockPresetId && (
                <Button variant="contained" color="warning" size="small" onClick={() => resolveReaction(pendingReactionRoll.id, "BLOCK")}>🛡️ Bloquear</Button>
              )}
              {pendingReactionRoll?.currentReactionTarget?.dodgePresetId && (
                <Button variant="contained" color="warning" size="small" onClick={() => resolveReaction(pendingReactionRoll.id, "DODGE")}>💨 Esquivar</Button>
              )}
              {pendingReactionRoll?.currentReactionTarget?.counterAttackPresetId && (
                <Button variant="contained" color="warning" size="small" onClick={() => resolveReaction(pendingReactionRoll.id, "COUNTER_ATTACK")}>⚔️ Contra-atacar</Button>
              )}
              <Button color="error" size="small" onClick={() => resolveReaction(pendingReactionRoll.id, "SKIP")}>✗ Não reagir</Button>
            </Stack>
          </Stack>
        </DialogContent>
      </Dialog>

      {/* ===== MODAL ADICIONAR PARTICIPANTE ===== */}
      <Dialog open={addParticipantOpen} onClose={() => setAddParticipantOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Adicionar Personagem ao Combate</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {loadingChars ? (
            <Box display="flex" justifyContent="center" p={3}><CircularProgress size={32} /></Box>
          ) : availableChars.length === 0 ? (
            <Typography color="#888" p={2} textAlign="center">Nenhum personagem disponível.</Typography>
          ) : (
            <List dense>
              {availableChars.map((char: any) => (
                <ListItem key={char.id} disablePadding>
                  <ListItemButton onClick={() => addParticipant(char.id)}>
                    <Avatar src={char.image ?? undefined} sx={{ width: 28, height: 28, mr: 1.5, fontSize: 12 }}>{char.name[0]}</Avatar>
                    <ListItemText primary={char.name} secondary={`HP: ${char.life}/${char.maxLife} • ${char.owner?.username ?? ""}`} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddParticipantOpen(false)} color="inherit">Cancelar</Button>
        </DialogActions>
      </Dialog>

      {/* ===== NOTAS DO COMBATE (Mestre) ===== */}
      {isMaster && (
        <Box sx={{ px: 2, py: 1, borderTop: "1px solid rgba(107,122,219,0.2)", background: "rgba(14,14,26,0.7)" }}>
          <Stack direction="row" spacing={1} alignItems="flex-end">
            <TextField
              label="Notas do combate"
              multiline
              maxRows={3}
              size="small"
              value={notesValue}
              onChange={(e) => setNotesValue(e.target.value)}
              sx={{ flex: 1, "& .MuiInputBase-root": { fontSize: 12 } }}
              placeholder="Anotações visíveis apenas para o mestre..."
            />
            <Button size="small" variant="outlined" disabled={notesSaving} onClick={saveNotes} sx={{ height: 40, minWidth: 60 }}>
              {notesSaving ? <CircularProgress size={14} /> : "Salvar"}
            </Button>
          </Stack>
        </Box>
      )}

      {/* ===== MODAL AJUSTE HP ===== */}
      <Dialog open={hpEditOpen} onClose={() => setHpEditOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Ajustar HP — {hpEditParticipant?.character?.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Typography fontSize={13} color="#aaa">HP atual: {hpEditParticipant?.currentLife} / {hpEditParticipant?.character?.maxLife}</Typography>
            <TextField label="Novo HP" type="number" value={hpEditValue} onChange={(e) => setHpEditValue(Number(e.target.value))} inputProps={{ min: 0, max: hpEditParticipant?.character?.maxLife ?? 9999 }} fullWidth autoFocus />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHpEditOpen(false)} color="inherit">Cancelar</Button>
          <Button variant="contained" onClick={submitHpEdit}>Confirmar</Button>
        </DialogActions>
      </Dialog>

      {/* ===== ESTATÍSTICAS DO COMBATE ===== */}
      <Dialog open={Boolean(combatStats)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: "#fbbf24" }}>⚔️ Combate Encerrado — Resumo</DialogTitle>
        <DialogContent>
          <Stack spacing={2}>
            <Typography fontSize={13} color="#aaa">Duração: {combatStats?.rounds ?? 0} round(s)</Typography>
            {(combatStats?.participants ?? []).length > 0 && (
              <Box sx={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                  <thead>
                    <tr>
                      {["Personagem", "Acertos", "Erros", "Dano Total", "Maior Hit"].map((h) => (
                        <th key={h} style={{ textAlign: "left", padding: "4px 8px", color: "#888", borderBottom: "1px solid #333" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {combatStats?.participants.map((p) => (
                      <tr key={p.id}>
                        <td style={{ padding: "4px 8px", color: "#e5e7eb" }}>{p.name}</td>
                        <td style={{ padding: "4px 8px", color: "#4ade80" }}>{p.hits}</td>
                        <td style={{ padding: "4px 8px", color: "#f87171" }}>{p.misses}</td>
                        <td style={{ padding: "4px 8px", color: "#fbbf24", fontWeight: 700 }}>{p.totalDamage}</td>
                        <td style={{ padding: "4px 8px", color: "#f97316" }}>{p.maxHit || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => { clearStats(); router.push("/protected/"); }}>
            Fechar
          </Button>
        </DialogActions>
      </Dialog>

      {/* ===== FULLSCREEN VISÃO GERAL ===== */}
      <AnimatePresence>
        {battleFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            style={{ position: "fixed", inset: 0, zIndex: 1300, background: "#080810", overflow: "auto" }}
          >
            <Box sx={{ p: 3 }}>
              {/* Header */}
              <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
                <Stack>
                  <Typography variant="h5" fontWeight="bold">⚔️ Visão Geral do Combate</Typography>
                  <Typography color="#666" fontSize={13}>Round {combat.round} — {ordered.length} participantes</Typography>
                </Stack>
                <IconButton onClick={() => setBattleFullscreen(false)} sx={{ color: "#aaa" }}>
                  <FullscreenExitIcon />
                </IconButton>
              </Stack>

              {/* Stream fullscreen */}
              {streamUrl && parseEmbedUrl(streamUrl) && (
                <Box sx={{ mb: 3, borderRadius: 2, overflow: "hidden", border: "1px solid rgba(107,122,219,0.3)", height: 480 }}>
                  <iframe
                    src={parseEmbedUrl(streamUrl)!}
                    style={{ width: "100%", height: "100%", border: "none" }}
                    allow="autoplay; fullscreen"
                    allowFullScreen
                  />
                </Box>
              )}

              {/* Participants grid */}
              <Box sx={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 2 }}>
                {ordered.map((p: any) => {
                  const isActive = p.turnOrder === combat.currentTurnIndex;
                  const isNpc = p.character.owner?.role === "MESTRE";
                  const showExactHp = isMaster || !isNpc;
                  const tier = getHpTier(p.currentLife, p.character.maxLife);
                  const hpPct = p.character.maxLife > 0 ? (p.currentLife / p.character.maxLife) * 100 : 0;

                  return (
                    <Card
                      key={p.id}
                      sx={{
                        bgcolor: isActive ? "rgba(79,195,247,0.1)" : "rgba(28,28,46,0.8)",
                        border: isActive ? "2px solid #4fc3f7" : "1px solid rgba(255,255,255,0.08)",
                        opacity: p.currentLife <= 0 ? 0.45 : 1,
                      }}
                    >
                      <CardContent>
                        <Stack direction="row" alignItems="center" spacing={2} mb={1.5}>
                          <Avatar
                            src={p.character.image ?? undefined}
                            alt={p.character.name}
                            sx={{ width: 48, height: 48, fontSize: 18, bgcolor: isActive ? "#4fc3f7" : "#374151", border: isActive ? "2px solid #4fc3f7" : "1px solid #555" }}
                          >
                            {p.character.name[0]}
                          </Avatar>
                          <Stack flex={1} minWidth={0}>
                            <Typography fontWeight={700} noWrap>{p.character.name}</Typography>
                            <Stack direction="row" spacing={0.5} mt={0.25}>
                              {isActive && <Chip label="Turno ativo" size="small" sx={{ fontSize: 10, height: 18, bgcolor: "#4fc3f7", color: "#000" }} />}
                              {isNpc && <Chip label="NPC" size="small" sx={{ fontSize: 10, height: 18, bgcolor: "#374151", color: "#9ca3af" }} />}
                              {p.currentLife <= 0 && <Chip label="Morto" size="small" sx={{ fontSize: 10, height: 18, bgcolor: "#333", color: "#666" }} />}
                            </Stack>
                          </Stack>
                        </Stack>

                        {showExactHp ? (
                          <>
                            <LinearProgress value={hpPct} variant="determinate" sx={{ height: 10, borderRadius: 5, bgcolor: "#333", mb: 0.5, "& .MuiLinearProgress-bar": { bgcolor: tier.color } }} />
                            <Stack direction="row" justifyContent="space-between">
                              <Typography fontSize={12} color="#aaa">{p.currentLife} / {p.character.maxLife} HP</Typography>
                              <Typography fontSize={12} color={tier.color} fontWeight={600}>{tier.label}</Typography>
                            </Stack>
                          </>
                        ) : (
                          <Box sx={{ px: 2, py: 0.75, borderRadius: 1, bgcolor: tier.bgColor, border: `1px solid ${tier.color}40`, mt: 0.5 }}>
                            <Typography fontSize={12} color={tier.color} fontWeight={600} textAlign="center">{tier.label}</Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Box>
  );
}
