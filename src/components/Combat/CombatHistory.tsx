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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useEffect, useState } from "react";
import api from "../../lib/api";

type HpSnapshot = {
    round: number;
    turnIndex: number;
    data: Record<string, number>;
};

type CombatStat = {
    id: string;
    name: string;
    totalDamage: number;
    hits: number;
    misses: number;
    maxHit: number;
};

type CombatSummary = {
    id: string;
    round: number;
    createdAt: string;
    hpSnapshots: HpSnapshot[];
    participants: { character: { id: string; name: string; maxLife: number } }[];
    logs: { id: string; type: string; message: string; createdAt: string }[];
    stats: { rounds: number; participants: CombatStat[] };
};

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
};

const CHART_COLORS = ["#4fc3f7", "#4ade80", "#f87171", "#fbbf24", "#a78bfa", "#fb923c"];

function HpChart({ snapshots, participants }: { snapshots: HpSnapshot[]; participants: { character: { id: string; name: string; maxLife: number } }[] }) {
    if (!snapshots.length || !participants.length) return null;

    const W = 500;
    const H = 90;
    const maxHp = Math.max(...participants.map((p) => p.character.maxLife), 1);

    const xOf = (i: number) =>
        snapshots.length === 1 ? W / 2 : (i / (snapshots.length - 1)) * W;
    const yOf = (hp: number) => H - Math.max(0, Math.min(hp / maxHp, 1)) * H;

    return (
        <Box sx={{ mt: 1.5 }}>
            <Typography fontSize={11} color="#666" mb={0.5}>HP ao longo do combate</Typography>
            <Box sx={{ overflowX: "auto" }}>
                <svg width="100%" viewBox={`0 0 ${W} ${H + 18}`} style={{ display: "block", minWidth: 260 }}>
                    {/* Grid lines */}
                    {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
                        <line key={pct} x1={0} x2={W} y1={H * pct} y2={H * pct} stroke="#ffffff10" strokeWidth={1} />
                    ))}

                    {participants.map((p, i) => {
                        const color = CHART_COLORS[i % CHART_COLORS.length];
                        const pts = snapshots
                            .map((s, idx) => {
                                const hp = s.data[p.character.id] ?? 0;
                                return `${xOf(idx).toFixed(1)},${yOf(hp).toFixed(1)}`;
                            })
                            .join(" ");

                        const lastHp = snapshots[snapshots.length - 1]?.data[p.character.id] ?? 0;
                        const labelY = yOf(lastHp);

                        return (
                            <g key={p.character.id}>
                                <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
                                <circle cx={xOf(snapshots.length - 1)} cy={labelY} r={3} fill={color} />
                                <text
                                    x={W - 2}
                                    y={labelY}
                                    fill={color}
                                    fontSize={9}
                                    textAnchor="end"
                                    dominantBaseline="middle"
                                >
                                    {p.character.name}
                                </text>
                            </g>
                        );
                    })}

                    {/* X-axis labels (rounds) */}
                    {snapshots
                        .filter((_, i) => i === 0 || i === snapshots.length - 1 || snapshots.length <= 8)
                        .map((s, i) => {
                            const origIdx = snapshots.indexOf(s);
                            return (
                                <text key={i} x={xOf(origIdx)} y={H + 13} fill="#555" fontSize={8} textAnchor="middle">
                                    R{s.round}
                                </text>
                            );
                        })}
                </svg>
            </Box>
        </Box>
    );
}

function StatsTable({ stats }: { stats: CombatSummary["stats"] }) {
    if (!stats?.participants?.length) return null;
    return (
        <Box sx={{ mt: 1.5, overflowX: "auto" }}>
            <Typography fontSize={11} color="#666" mb={0.5}>Estatísticas</Typography>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                <thead>
                    <tr>
                        {["Personagem", "Acertos", "Erros", "Dano Total", "Maior Hit"].map((h) => (
                            <th key={h} style={{ textAlign: "left", padding: "3px 6px", color: "#666", borderBottom: "1px solid #333" }}>{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {stats.participants.map((p) => (
                        <tr key={p.id}>
                            <td style={{ padding: "3px 6px", color: "#ddd" }}>{p.name}</td>
                            <td style={{ padding: "3px 6px", color: "#4ade80" }}>{p.hits}</td>
                            <td style={{ padding: "3px 6px", color: "#f87171" }}>{p.misses}</td>
                            <td style={{ padding: "3px 6px", color: "#fbbf24", fontWeight: 700 }}>{p.totalDamage}</td>
                            <td style={{ padding: "3px 6px", color: "#f97316" }}>{p.maxHit || "—"}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </Box>
    );
}

export function CombatHistory() {
    const [combats, setCombats] = useState<CombatSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState<Set<string>>(new Set());

    useEffect(() => {
        api.get("/combat/history")
            .then((res) => setCombats(res.data.combats ?? []))
            .catch(() => setCombats([]))
            .finally(() => setLoading(false));
    }, []);

    function toggle(id: string) {
        setExpanded((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    }

    function exportLog(combat: CombatSummary) {
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
                <Typography color="#888">Nenhum combate encerrado encontrado.</Typography>
            </Box>
        );
    }

    return (
        <Stack spacing={2}>
            {combats.map((combat) => {
                const isOpen = expanded.has(combat.id);
                return (
                    <Card
                        key={combat.id}
                        sx={{
                            backgroundColor: "rgba(255,255,255,0.03)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: 2,
                        }}
                    >
                        <CardContent>
                            <Stack
                                direction="row"
                                alignItems="center"
                                justifyContent="space-between"
                                onClick={() => toggle(combat.id)}
                                sx={{ cursor: "pointer" }}
                            >
                                <Stack spacing={0.5}>
                                    <Typography fontWeight={700}>
                                        Combate — {new Date(combat.createdAt).toLocaleString()}
                                    </Typography>
                                    <Stack direction="row" spacing={1} flexWrap="wrap">
                                        <Chip label={`${combat.round} rounds`} size="small" sx={{ fontSize: 11 }} />
                                        {combat.participants.map((p) => (
                                            <Chip
                                                key={p.character.id}
                                                label={p.character.name}
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontSize: 11 }}
                                            />
                                        ))}
                                    </Stack>
                                </Stack>

                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => { e.stopPropagation(); exportLog(combat); }}
                                        sx={{ color: "#aaa" }}
                                        title="Exportar log"
                                    >
                                        ⬇
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        sx={{
                                            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
                                            transition: "transform 0.2s",
                                        }}
                                    >
                                        <ExpandMoreIcon fontSize="small" />
                                    </IconButton>
                                </Stack>
                            </Stack>

                            <Collapse in={isOpen} timeout="auto" unmountOnExit>
                                <Box mt={1}>
                                    {/* HP evolution chart */}
                                    {combat.hpSnapshots?.length > 0 && (
                                        <HpChart snapshots={combat.hpSnapshots} participants={combat.participants} />
                                    )}

                                    {/* Combat stats table */}
                                    <StatsTable stats={combat.stats} />

                                    {/* Action logs */}
                                    <Typography fontSize={11} color="#666" mt={1.5} mb={0.5}>Log de ações</Typography>
                                    <Stack spacing={0.5}>
                                        {combat.logs.map((log) => (
                                            <Box
                                                key={log.id}
                                                sx={{
                                                    p: 1,
                                                    borderRadius: 1,
                                                    borderLeft: `3px solid ${LOG_COLORS[log.type] ?? "#888"}`,
                                                    backgroundColor: `${LOG_COLORS[log.type] ?? "#888"}10`,
                                                }}
                                            >
                                                <Typography variant="caption" sx={{ fontFamily: "monospace", color: "#ddd" }}>
                                                    [{log.type}] {log.message}
                                                </Typography>
                                            </Box>
                                        ))}
                                        {combat.logs.length === 0 && (
                                            <Typography variant="caption" color="#666">
                                                Sem logs registrados.
                                            </Typography>
                                        )}
                                    </Stack>
                                </Box>
                            </Collapse>
                        </CardContent>
                    </Card>
                );
            })}
        </Stack>
    );
}
