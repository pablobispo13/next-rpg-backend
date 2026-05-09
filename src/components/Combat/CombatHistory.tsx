"use client";

import {
    Box,
    Stack,
    Typography,
    Card,
    CardContent,
    Chip,
    Collapse,
    CircularProgress,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Tooltip,
    Switch,
    FormControlLabel,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import DeleteIcon from "@mui/icons-material/Delete";
import { useEffect, useState } from "react";
import api from "../../lib/api";

/* ===========================
   TYPES
=========================== */

type HpSnapshot = {
    round: number;
    turnIndex: number;
    data: Record<string, number>;
};

type CombatStat = {
    id: string;
    name: string;
    isNpc: boolean;
    totalDamage: number;
    totalHealing: number;
    hits: number;
    misses: number;
    maxHit: number;
};

type Participant = {
    character: {
        id: string;
        name: string;
        maxLife: number;
        owner?: { role: string };
    };
};

type CombatSummary = {
    id: string;
    round: number;
    createdAt: string;
    hpSnapshots: HpSnapshot[];
    participants: Participant[];
    logs: { id: string; type: string; message: string; createdAt: string }[];
    stats: { rounds: number; participants: CombatStat[] };
};

/* ===========================
   CONSTANTS
=========================== */

const LOG_COLORS: Record<string, string> = {
    ROLL: "#fbbf24",
    DAMAGE: "#f87171",
    HEAL: "#4ade80",
    REACTION: "#60a5fa",
    COMBAT_START: "#f97316",
    COMBAT_END: "#f97316",
    DAMAGE_OVER_TIME: "#fb923c",
    HEAL_OVER_TIME: "#86efac",
    MANUAL_OVERRIDE: "#c084fc",
    TURN_START: "#6b7280",
    TURN_END: "#6b7280",
};

const LOG_LABELS: Record<string, string> = {
    ROLL: "Rolagem",
    DAMAGE: "Dano",
    HEAL: "Cura",
    REACTION: "Reação",
    COMBAT_START: "Início",
    COMBAT_END: "Fim",
    DAMAGE_OVER_TIME: "DoT",
    HEAL_OVER_TIME: "HoT",
    MANUAL_OVERRIDE: "Ajuste",
    TURN_START: "Turno↑",
    TURN_END: "Turno↓",
};

const CHART_COLORS = [
    "#4fc3f7", "#4ade80", "#f87171", "#fbbf24",
    "#a78bfa", "#fb923c", "#34d399", "#f472b6",
];

/* ===========================
   HP CHART
=========================== */

function HpChart({
    snapshots,
    participants,
    chartId,
    hideNpcs,
}: {
    snapshots: HpSnapshot[];
    participants: Participant[];
    chartId: string;
    hideNpcs: boolean;
}) {
    const visibleParticipants = hideNpcs
        ? participants.filter((p) => p.character.owner?.role !== "MESTRE")
        : participants;

    if (!snapshots.length || !visibleParticipants.length) return null;

    const ML = 36;
    const MR = 8;
    const MT = 6;
    const ROUNDS_H = 20;
    const LEGEND_ROWS = Math.ceil(visibleParticipants.length / 3);
    const LEGEND_H = LEGEND_ROWS * 17 + 8;

    const CW = 480;
    const CH = 150;
    const SVG_W = ML + CW + MR;
    const SVG_H = MT + CH + ROUNDS_H + LEGEND_H;

    const maxHp = Math.max(...visibleParticipants.map((p) => p.character.maxLife), 1);
    const baseY = MT + CH;

    const xOf = (i: number) =>
        ML + (snapshots.length === 1 ? CW / 2 : (i / (snapshots.length - 1)) * CW);
    const yOf = (hp: number) =>
        MT + CH - Math.max(0, Math.min(hp / maxHp, 1)) * CH;

    return (
        <Box sx={{ mt: 1.5 }}>
            <Typography fontSize={11} color="#666" mb={0.5}>HP ao longo do combate</Typography>
            <Box sx={{ overflowX: "auto" }}>
                <svg width="100%" viewBox={`0 0 ${SVG_W} ${SVG_H}`} style={{ display: "block", minWidth: 280 }}>
                    <defs>
                        {visibleParticipants.map((p, i) => {
                            const color = CHART_COLORS[i % CHART_COLORS.length];
                            return (
                                <linearGradient key={p.character.id} id={`hpgrad-${chartId}-${i}`} x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor={color} stopOpacity="0.22" />
                                    <stop offset="100%" stopColor={color} stopOpacity="0.01" />
                                </linearGradient>
                            );
                        })}
                    </defs>

                    {/* Grid + Y-axis labels */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct) => {
                        const y = MT + CH * (1 - pct);
                        return (
                            <g key={pct}>
                                <line x1={ML} x2={ML + CW} y1={y} y2={y} stroke={pct === 0 ? "#2a2a3a" : "#ffffff08"} strokeWidth={1} />
                                <text x={ML - 4} y={y} fill="#555" fontSize={8} textAnchor="end" dominantBaseline="middle">
                                    {Math.round(pct * 100)}%
                                </text>
                            </g>
                        );
                    })}
                    <line x1={ML} x2={ML} y1={MT} y2={MT + CH} stroke="#2a2a3a" strokeWidth={1} />

                    {/* Area fills */}
                    {visibleParticipants.map((p, i) => {
                        const points = snapshots.map((s, idx) => ({ x: xOf(idx), y: yOf(s.data[p.character.id] ?? 0) }));
                        if (!points.length) return null;
                        const areaPath = [
                            `M ${points[0].x.toFixed(1)},${baseY}`,
                            ...points.map((pt) => `L ${pt.x.toFixed(1)},${pt.y.toFixed(1)}`),
                            `L ${points[points.length - 1].x.toFixed(1)},${baseY}`,
                            "Z",
                        ].join(" ");
                        return <path key={`area-${p.character.id}`} d={areaPath} fill={`url(#hpgrad-${chartId}-${i})`} />;
                    })}

                    {/* Lines + dots */}
                    {visibleParticipants.map((p, i) => {
                        const color = CHART_COLORS[i % CHART_COLORS.length];
                        const points = snapshots.map((s, idx) => ({ x: xOf(idx), y: yOf(s.data[p.character.id] ?? 0) }));
                        if (!points.length) return null;
                        const linePts = points.map((pt) => `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`).join(" ");
                        const last = points[points.length - 1];
                        return (
                            <g key={`line-${p.character.id}`}>
                                <polyline points={linePts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                                <circle cx={last.x} cy={last.y} r={3.5} fill={color} />
                            </g>
                        );
                    })}

                    {/* Round labels */}
                    {snapshots
                        .filter((_, i) => {
                            if (snapshots.length <= 10) return true;
                            const step = Math.ceil(snapshots.length / 8);
                            return i % step === 0 || i === snapshots.length - 1;
                        })
                        .map((s) => {
                            const origIdx = snapshots.indexOf(s);
                            return (
                                <text key={origIdx} x={xOf(origIdx)} y={MT + CH + 13} fill="#555" fontSize={8} textAnchor="middle">
                                    R{s.round}
                                </text>
                            );
                        })}

                    {/* Legend */}
                    {visibleParticipants.map((p, i) => {
                        const color = CHART_COLORS[i % CHART_COLORS.length];
                        const COLS = 3;
                        const col = i % COLS;
                        const row = Math.floor(i / COLS);
                        const lx = ML + (CW / COLS) * col;
                        const ly = MT + CH + ROUNDS_H + 8 + row * 17;
                        return (
                            <g key={`legend-${p.character.id}`}>
                                <rect x={lx} y={ly - 5} width={8} height={8} rx={2} fill={color} opacity={0.85} />
                                <text x={lx + 12} y={ly} fill="#999" fontSize={9} dominantBaseline="middle">
                                    {p.character.name}
                                </text>
                            </g>
                        );
                    })}
                </svg>
            </Box>
        </Box>
    );
}

/* ===========================
   STATS TABLE
=========================== */

function StatsTable({ stats, hideNpcs }: { stats: CombatSummary["stats"]; hideNpcs: boolean }) {
    if (!stats?.participants?.length) return null;

    const visible = hideNpcs
        ? stats.participants.filter((p) => !p.isNpc)
        : stats.participants;

    if (!visible.length) return null;

    const maxDamage = Math.max(...visible.map((p) => p.totalDamage), 1);
    const sorted = [...visible].sort((a, b) => b.totalDamage - a.totalDamage);

    return (
        <Box sx={{ mt: 1.5, overflowX: "auto" }}>
            <Typography fontSize={11} color="#666" mb={0.5}>Estatísticas</Typography>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                    <tr>
                        {["Personagem", "Acertos", "Erros", "Dano Total", "Cura Total", "Maior Hit"].map((h) => (
                            <th key={h} style={{ textAlign: "left", padding: "3px 6px", color: "#666", borderBottom: "1px solid #2a2a3a" }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {sorted.map((p) => (
                        <tr key={p.id}>
                            <td style={{ padding: "4px 6px", color: "#ddd" }}>{p.name}</td>
                            <td style={{ padding: "4px 6px", color: "#4ade80" }}>{p.hits}</td>
                            <td style={{ padding: "4px 6px", color: "#f87171" }}>{p.misses}</td>
                            <td style={{ padding: "4px 6px", color: "#fbbf24", fontWeight: 700 }}>
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <span>{p.totalDamage}</span>
                                    {p.totalDamage > 0 && (
                                        <Box sx={{ height: 4, width: Math.max(4, Math.round((p.totalDamage / maxDamage) * 56)), bgcolor: "#fbbf2450", borderRadius: 2, flexShrink: 0 }} />
                                    )}
                                </Stack>
                            </td>
                            <td style={{ padding: "4px 6px", color: "#4ade80" }}>
                                {(p.totalHealing ?? 0) > 0 ? p.totalHealing : "—"}
                            </td>
                            <td style={{ padding: "4px 6px", color: "#f97316" }}>{p.maxHit || "—"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Box>
    );
}

/* ===========================
   COMBAT CARD
=========================== */

function CombatCard({
    combat,
    hideNpcs,
    onDelete,
}: {
    combat: CombatSummary;
    hideNpcs: boolean;
    onDelete: (id: string) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [activeTypes, setActiveTypes] = useState<Set<string>>(new Set());
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const visibleParticipants = hideNpcs
        ? combat.participants.filter((p) => p.character.owner?.role !== "MESTRE")
        : combat.participants;

    const hiddenNpcCount = hideNpcs
        ? combat.participants.filter((p) => p.character.owner?.role === "MESTRE").length
        : 0;

    const logTypes = Array.from(new Set(combat.logs.map((l) => l.type)));
    const filteredLogs = activeTypes.size === 0 ? combat.logs : combat.logs.filter((l) => activeTypes.has(l.type));

    function toggleType(type: string) {
        setActiveTypes((prev) => {
            const next = new Set(prev);
            next.has(type) ? next.delete(type) : next.add(type);
            return next;
        });
    }

    function exportLog() {
        const lines = combat.logs.map((l) => `[${l.type}] ${l.message}`).join("\n");
        const blob = new Blob(
            [`=== Combate (Round ${combat.round}) — ${new Date(combat.createdAt).toLocaleString()} ===\n\n${lines}`],
            { type: "text/plain" }
        );
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `historico-combate-${combat.id}.txt`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async function handleDelete() {
        setDeleting(true);
        try {
            await api.delete(`/combat/${combat.id}`);
            onDelete(combat.id);
        } finally {
            setDeleting(false);
            setConfirmDelete(false);
        }
    }

    return (
        <>
            <Card
                sx={{
                    backgroundColor: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 2,
                    transition: "border-color 0.2s",
                    "&:hover": { borderColor: "rgba(255,255,255,0.14)" },
                }}
            >
                <CardContent>
                    {/* Header */}
                    <Stack
                        direction="row"
                        alignItems="center"
                        justifyContent="space-between"
                        onClick={() => setIsOpen((v) => !v)}
                        sx={{ cursor: "pointer" }}
                    >
                        <Stack spacing={0.5}>
                            <Typography fontWeight={700} fontSize={13}>
                                {new Date(combat.createdAt).toLocaleString("pt-BR", {
                                    day: "2-digit", month: "2-digit", year: "numeric",
                                    hour: "2-digit", minute: "2-digit",
                                })}
                                <Typography component="span" fontSize={12} color="#666" ml={1}>
                                    · {combat.round} rounds
                                </Typography>
                            </Typography>
                            <Stack direction="row" spacing={0.75} flexWrap="wrap" alignItems="center">
                                {visibleParticipants.map((p) => (
                                    <Chip
                                        key={p.character.id}
                                        label={p.character.name}
                                        size="small"
                                        variant="outlined"
                                        sx={{ fontSize: 10, height: 18, borderColor: "#333", color: "#aaa" }}
                                    />
                                ))}
                                {hiddenNpcCount > 0 && (
                                    <Typography fontSize={10} color="#444" fontStyle="italic">
                                        +{hiddenNpcCount} NPC(s)
                                    </Typography>
                                )}
                            </Stack>
                        </Stack>

                        <Stack direction="row" alignItems="center" spacing={0.5} onClick={(e) => e.stopPropagation()}>
                            <Tooltip title="Exportar log (.txt)">
                                <IconButton size="small" onClick={exportLog} sx={{ color: "#555", "&:hover": { color: "#aaa" } }}>
                                    ⬇
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Excluir combate">
                                <IconButton size="small" onClick={() => setConfirmDelete(true)} sx={{ color: "#555", "&:hover": { color: "#f87171" } }}>
                                    <DeleteIcon sx={{ fontSize: 16 }} />
                                </IconButton>
                            </Tooltip>
                            <IconButton
                                size="small"
                                onClick={() => setIsOpen((v) => !v)}
                                sx={{ color: "#666", transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                            >
                                <ExpandMoreIcon fontSize="small" />
                            </IconButton>
                        </Stack>
                    </Stack>

                    {/* Expanded content */}
                    <Collapse in={isOpen} timeout="auto" unmountOnExit>
                        <Box mt={1.5}>
                            {combat.hpSnapshots?.length > 0 && (
                                <HpChart
                                    snapshots={combat.hpSnapshots}
                                    participants={combat.participants}
                                    chartId={combat.id}
                                    hideNpcs={hideNpcs}
                                />
                            )}

                            <StatsTable stats={combat.stats} hideNpcs={hideNpcs} />

                            {/* Log section */}
                            <Box mt={1.5}>
                                <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={0.5} mb={0.75}>
                                    <Typography fontSize={11} color="#666">
                                        Log de ações
                                        {activeTypes.size > 0 && (
                                            <Typography
                                                component="span" fontSize={10} color="#4fc3f7" ml={1}
                                                sx={{ cursor: "pointer" }}
                                                onClick={() => setActiveTypes(new Set())}
                                            >
                                                (limpar filtro)
                                            </Typography>
                                        )}
                                    </Typography>
                                    {logTypes.length > 0 && (
                                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                            {logTypes.map((type) => {
                                                const active = activeTypes.has(type);
                                                const color = LOG_COLORS[type] ?? "#888";
                                                return (
                                                    <Chip
                                                        key={type}
                                                        label={LOG_LABELS[type] ?? type}
                                                        size="small"
                                                        onClick={() => toggleType(type)}
                                                        sx={{
                                                            fontSize: 9, height: 18, cursor: "pointer",
                                                            bgcolor: active ? `${color}25` : "transparent",
                                                            border: `1px solid ${active ? color : "#333"}`,
                                                            color: active ? color : "#666",
                                                            "&:hover": { bgcolor: `${color}18` },
                                                        }}
                                                    />
                                                );
                                            })}
                                        </Stack>
                                    )}
                                </Stack>

                                <Stack spacing={0.4} sx={{ maxHeight: 320, overflowY: "auto" }}>
                                    {filteredLogs.map((log) => (
                                        <Box
                                            key={log.id}
                                            sx={{
                                                px: 1, py: "3px", borderRadius: 0.75,
                                                borderLeft: `3px solid ${LOG_COLORS[log.type] ?? "#555"}`,
                                                backgroundColor: `${LOG_COLORS[log.type] ?? "#555"}08`,
                                            }}
                                        >
                                            <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#ccc", fontSize: 11, lineHeight: 1.4 }}>
                                                [{log.type}] {log.message}
                                            </Typography>
                                        </Box>
                                    ))}
                                    {filteredLogs.length === 0 && (
                                        <Typography variant="caption" color="#555">
                                            {activeTypes.size > 0 ? "Nenhum log para o filtro selecionado." : "Sem logs registrados."}
                                        </Typography>
                                    )}
                                </Stack>
                            </Box>
                        </Box>
                    </Collapse>
                </CardContent>
            </Card>

            {/* Confirm delete dialog */}
            <Dialog open={confirmDelete} onClose={() => !deleting && setConfirmDelete(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ color: "#f87171", pb: 1 }}>Excluir combate?</DialogTitle>
                <DialogContent>
                    <Typography fontSize={13} color="#aaa">
                        Todos os logs, rolagens e participantes serão removidos permanentemente.
                    </Typography>
                    <Typography fontSize={12} color="#555" mt={1}>
                        {new Date(combat.createdAt).toLocaleString("pt-BR")} · {combat.round} rounds ·{" "}
                        {combat.participants.map((p) => p.character.name).join(", ")}
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmDelete(false)} color="inherit" disabled={deleting}>Cancelar</Button>
                    <Button variant="contained" color="error" disabled={deleting} onClick={handleDelete}>
                        {deleting ? <CircularProgress size={14} sx={{ mr: 0.75 }} /> : null}
                        Excluir
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

/* ===========================
   COMBAT HISTORY (root)
=========================== */

export function CombatHistory() {
    const [combats, setCombats] = useState<CombatSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [hideNpcs, setHideNpcs] = useState(false);

    useEffect(() => {
        api.get("/combat/history")
            .then((res) => setCombats(res.data.combats ?? []))
            .catch(() => setCombats([]))
            .finally(() => setLoading(false));
    }, []);

    function handleDelete(id: string) {
        setCombats((prev) => prev.filter((c) => c.id !== id));
    }

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
            </Box>
        );
    }

    if (combats.length === 0) {
        return (
            <Box p={4} textAlign="center">
                <Typography color="#666">Nenhum combate encerrado encontrado.</Typography>
            </Box>
        );
    }

    return (
        <Stack spacing={2}>
            {/* Toolbar */}
            <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography fontSize={12} color="#555">
                    {combats.length} combate(s) encerrado(s)
                </Typography>
                <FormControlLabel
                    control={
                        <Switch
                            size="small"
                            checked={hideNpcs}
                            onChange={(e) => setHideNpcs(e.target.checked)}
                            sx={{
                                "& .MuiSwitch-switchBase.Mui-checked": { color: "#4fc3f7" },
                                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: "#4fc3f740" },
                            }}
                        />
                    }
                    label={
                        <Typography fontSize={12} color={hideNpcs ? "#4fc3f7" : "#666"}>
                            Ocultar NPCs
                        </Typography>
                    }
                    labelPlacement="start"
                    sx={{ m: 0, gap: 0.75 }}
                />
            </Stack>

            {/* Combat list */}
            <Stack spacing={1.5}>
                {combats.map((combat) => (
                    <CombatCard key={combat.id} combat={combat} hideNpcs={hideNpcs} onDelete={handleDelete} />
                ))}
            </Stack>
        </Stack>
    );
}
