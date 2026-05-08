"use client";

import {
    Box,
    Typography,
    Stack,
    Paper,
    ToggleButton,
    ToggleButtonGroup,
} from "@mui/material";
import { useEffect, useState } from "react";

/* =========================
   TYPES
========================= */

export type CombatTimelineProps = {
    logs: CombatLog[];
};

export type CharacterRef = {
    id: string;
    name: string;
};

export type RollRef = {
    id: string;

    diceRolled: string;
    rolls: number[];
    modifier: number;
    total: number;
    impactRolls?: number[];

    success?: boolean | null;
    critical: boolean;

    damage?: number | null;
    healing?: number | null;

    pendingReaction?: boolean;
    reacted?: boolean;
};

export type CombatLog = {
    id: string;

    type:
    | "COMBAT_START"
    | "COMBAT_END"
    | "TURN_START"
    | "TURN_END"
    | "ROLL"
    | "REACTION"
    | "DAMAGE"
    | "HEAL"
    | "HEAL_OVER_TIME"
    | "DAMAGE_OVER_TIME"
    | "MANUAL_OVERRIDE"
    | "SYSTEM";

    message: string;
    createdAt: string;

    character?: CharacterRef | null;
    target?: CharacterRef | null;

    roll?: RollRef | null;

    rollId?: string | null;
    turnId?: string | null;
};

export type TimelineBlock = {
    id: string;
    title: string;
    logs: CombatLog[];
};

export type CombatTimelineMode = "NARRATIVE" | "TECHNICAL";

/* =========================
   TIMELINE BUILDER
========================= */

function buildTimeline(logs: CombatLog[]): TimelineBlock[] {
    const ordered = [...logs].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    const timeline: TimelineBlock[] = [];
    let current: TimelineBlock | null = null;

    for (const log of ordered) {
        if (log.type === "COMBAT_START") continue;

        if (log.type === "TURN_START") {
            current = {
                id: log.turnId ?? log.id,
                title: `Turno de ${log.character?.name ?? "?"}`,
                logs: [],
            };
            timeline.push(current);
            continue;
        }

        if (!current) {
            current = {
                id: "system",
                title: "Sistema",
                logs: [],
            };
            timeline.push(current);
        }

        current.logs.push(log);

        if (log.type === "TURN_END") {
            current = null;
        }
    }

    return timeline;
}

/* =========================
   COMPONENTE PRINCIPAL
========================= */

export function CombatTimeline({ logs }: CombatTimelineProps) {
    const [mode, setMode] = useState<CombatTimelineMode>("NARRATIVE");
    const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

    const timeline = buildTimeline(logs).reverse();

    function toggle(id: string) {
        setCollapsed(prev => ({
            ...prev,
            [id]: !prev[id],
        }));
    }

    useEffect(() => {
        if (timeline.length > 0) {
            setCollapsed(prev => ({
                ...prev,
                [timeline[0].id]: false,
            }));
        }
    }, [logs]);
    
    return (
        <Box sx={{ width: 360, height: "100%", overflowY: "auto" }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                <Typography variant="h6">Log de Combate</Typography>
                <ToggleButtonGroup
                    size="small"
                    value={mode}
                    exclusive
                    onChange={(_, v) => v && setMode(v)}
                >
                    <ToggleButton value="NARRATIVE">📖</ToggleButton>
                    <ToggleButton value="TECHNICAL">🛠</ToggleButton>
                </ToggleButtonGroup>
            </Stack>

            <Stack spacing={1}>
                {timeline.map(block => {
                    const isCollapsed = collapsed[block.id];

                    return (
                        <Paper
                            key={block.id}
                            variant="outlined"
                            sx={{
                                p: 1,
                                backgroundColor: "#1f2937",
                                borderLeft: "4px solid #374151",
                            }}
                        >
                            <Typography
                                fontWeight="bold"
                                mb={0.5}
                                sx={{ cursor: "pointer" }}
                                onClick={() => toggle(block.id)}
                            >
                                {isCollapsed ? "▶" : "▼"} {block.title}
                            </Typography>

                            {!isCollapsed && (
                                <Stack spacing={0.5} ml={1}>
                                    {block.logs.map(log => (
                                        <ActionLine
                                            key={log.id}
                                            log={log}
                                            mode={mode}
                                        />
                                    ))}
                                </Stack>
                            )}
                        </Paper>
                    );
                })}
            </Stack>
        </Box>
    );
}

/* =========================
   ACTION LINE
========================= */

function ActionLine({
    log,
    mode,
}: {
    log: CombatLog;
    mode: CombatTimelineMode;
}) {

    /* =========================
       TECHNICAL MODE
    ========================= */

    if (mode === "TECHNICAL") {
        const r = log.roll;

        return (
            <Box sx={{ fontSize: 11, color: "#9ca3af", mb: 0.5 }}>
                <Typography fontSize={11}>
                    [{log.type}] {log.character?.name ?? "?"}
                    {log.target && ` → ${log.target.name}`}
                </Typography>

                {r && (
                    <Box ml={1}>
                        <Typography fontSize={11}>
                            🎲 {r.diceRolled} [{r.rolls.join(", ")}] + {r.modifier} ={" "}
                            <b>{r.total}</b>
                            {r.critical && " (CRITICAL)"}
                        </Typography>

                        {typeof r.damage === "number" && (
                            <Typography fontSize={11}>
                                💥 Dano:{" "}
                                {r.impactRolls && r.impactRolls.length > 0
                                    ? `[${r.impactRolls.join(", ")}] = `
                                    : ""}
                                {r.damage}
                                {r.critical && " (crítico)"}
                            </Typography>
                        )}

                        {typeof r.healing === "number" && r.healing > 0 && (
                            <Typography fontSize={11}>
                                💚 Cura:{" "}
                                {r.impactRolls && r.impactRolls.length > 0
                                    ? `[${r.impactRolls.join(", ")}] = `
                                    : ""}
                                {r.healing}
                            </Typography>
                        )}

                        <Typography fontSize={11}>
                            Estado:{" "}
                            {r.pendingReaction
                                ? "AGUARDANDO REAÇÃO"
                                : r.success === true
                                    ? "SUCESSO FINAL"
                                    : r.success === false
                                        ? "FALHA"
                                        : "INDEFINIDO"}
                        </Typography>
                    </Box>
                )}
            </Box>
        );
    }

    /* =========================
       NARRATIVE MODE
    ========================= */

    if (log.type === "ROLL" && log.roll) {
        const r = log.roll;

        const isFinalSuccess = r.success === true && !r.pendingReaction;
        const isFailure = r.success === false;

        let color = "#d1d5db";

        if (r.pendingReaction) color = "#60a5fa";
        else if (isFinalSuccess) color = "#4ade80";
        else if (isFailure) color = "#f87171";

        return (
            <Box>
                <Typography fontSize={13} color="#facc15">
                    ⚔️ {log.message}
                </Typography>

                <Typography fontSize={12} color={color} ml={2}>
                    🎲 {r.diceRolled} → {r.total}
                    {r.pendingReaction && " • Acertou, aguardando reação"}
                    {isFinalSuccess && " • Sucesso"}
                    {isFailure && " • Falhou"}
                    {r.critical && " • CRÍTICO"}
                </Typography>

                {typeof r.damage === "number" && r.damage > 0 && !r.pendingReaction && (
                    <Typography fontSize={11} ml={4} color="#f87171">
                        💥 Dano: {r.impactRolls && r.impactRolls.length > 0 ? `[${r.impactRolls.join(", ")}] = ` : ""}{r.damage}
                        {r.critical && " (crítico)"}
                    </Typography>
                )}

                {typeof r.healing === "number" && r.healing > 0 && (
                    <Typography fontSize={11} ml={4} color="#4ade80">
                        💚 Cura: {r.impactRolls && r.impactRolls.length > 0 ? `[${r.impactRolls.join(", ")}] = ` : ""}{r.healing}
                    </Typography>
                )}
            </Box>
        );
    }

    if (log.type === "DAMAGE") {
        return (
            <Typography fontSize={12} color="#f87171" ml={2}>
                💥 {log.message}
            </Typography>
        );
    }

    if (log.type === "DAMAGE_OVER_TIME") {
        return (
            <Typography fontSize={12} color="#fb923c" ml={2}>
                🔥 {log.message}
            </Typography>
        );
    }

    if (log.type === "HEAL") {
        return (
            <Typography fontSize={12} color="#4ade80" ml={2}>
                💚 {log.message}
            </Typography>
        );
    }

    if (log.type === "HEAL_OVER_TIME") {
        return (
            <Typography fontSize={12} color="#86efac" ml={2}>
                ✨ {log.message}
            </Typography>
        );
    }

    if (log.type === "REACTION") {
        return (
            <Typography fontSize={12} color="#60a5fa" ml={4}>
                ↩️ {log.message}
            </Typography>
        );
    }

    if (log.type === "TURN_END") {
        return (
            <Typography fontSize={11} color="#9ca3af" ml={1}>
                ⏹ Turno encerrado
            </Typography>
        );
    }

    if (log.type === "MANUAL_OVERRIDE") {
        return (
            <Typography fontSize={11} color="#a78bfa" ml={2}>
                ⚙️ {log.message}
            </Typography>
        );
    }

    return (
        <Typography fontSize={12} color="#d1d5db">
            {log.message}
        </Typography>
    );
}