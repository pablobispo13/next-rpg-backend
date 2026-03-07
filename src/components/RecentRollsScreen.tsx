"use client";

import {
    Box,
    Card,
    CardContent,
    Typography,
    Stack,
    CircularProgress,
    Button,
} from "@mui/material";
import { useEffect, useState } from "react";
import api from "../lib/api";

type Roll = {
    id: string;
    characterId: string;
    presetId: string;
    combatId: string | null;
    turnId: string | null;
    targetIds: string[];

    diceRolled: string;      // ex: "1d20"
    rolls: number[];         // ex: [8]
    modifier: number;
    total: number;

    success: boolean;
    critical: boolean;

    damage: number | null;
    healing: number | null;

    pendingReaction: boolean;
    reactionType: string | null;
    reacted: boolean;

    createdAt: string;

    character: {
        id: string;
        name: string;
    };

    preset: {
        id: string;
        name: string;
        type: string;
    };
};

export default function RecentRollsScreen() {
    const [rolls, setRolls] = useState<Roll[]>([]);
    const [loading, setLoading] = useState(true);

    async function loadRolls() {
        try {
            setLoading(true);
            const res = await api.get("/roll?limit=30");
            setRolls(
                res.data.rolls.sort(
                    (a: Roll, b: Roll) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                )
            );
        } catch (err) {
            console.error("Erro ao carregar testes", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadRolls();
    }, []);

    return (
        <Box
            sx={{
                minHeight: "100vh",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#0e0e1a",
                color: "#fff",
                p: 3,
            }}
        >
            <Box
                sx={{
                    width: "100%",
                    maxWidth: 600,
                }}
            >
                <Stack spacing={2}>
                    <Typography variant="h5" textAlign="center">
                        Testes Recentes
                    </Typography>

                    <Button
                        variant="outlined"
                        onClick={loadRolls}
                        disabled={loading}
                    >
                        Atualizar
                    </Button>

                    {loading ? (
                        <Box display="flex" justifyContent="center" mt={4}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Stack spacing={2}>
                            {rolls.map((roll) => (
                                <Card
                                    key={roll.id}
                                    sx={{
                                        backgroundColor: "#1c1c2e",
                                        border: roll.critical
                                            ? "1px solid #ff9800"
                                            : "1px solid #333",
                                    }}
                                >
                                    <CardContent>
                                        <Stack spacing={1.2}>
                                            {/* Cabeçalho */}
                                            <Typography fontWeight="bold">
                                                {roll.character.name}
                                            </Typography>

                                            {roll.preset &&
                                                <Typography fontSize={13} color="#aaa">
                                                    {roll.preset.name} • {roll.preset.type}
                                                </Typography>}

                                            {/* Bloco do dado */}
                                            <Box
                                                sx={{
                                                    mt: 1,
                                                    p: 1.5,
                                                    borderRadius: 1,
                                                    backgroundColor: "#151525",
                                                    border: roll.critical
                                                        ? "1px solid #ff9800"
                                                        : "1px solid #2a2a40",
                                                }}
                                            >
                                                <Typography fontSize={14}>
                                                    🎲 {roll.diceRolled} →{" "}
                                                    <strong>{roll.rolls.join(", ")}</strong>
                                                    {roll.modifier !== 0 && (
                                                        <> {roll.modifier > 0 ? "+" : ""}{roll.modifier}</>
                                                    )}
                                                </Typography>

                                                <Typography
                                                    mt={0.5}
                                                    fontSize={16}
                                                    fontWeight="bold"
                                                >
                                                    Total: {roll.total}
                                                    {roll.critical && " 🔥 CRÍTICO"}
                                                </Typography>
                                            </Box>

                                            {/* Resultado */}
                                            {roll.success && roll.preset.type != "TEST" && (roll.preset.type === "REACT" && (roll.combatId || roll.turnId)) &&
                                                <Typography
                                                    fontWeight="bold"
                                                    color={roll.success ? "#66bb6a" : "#ef5350"}
                                                >
                                                    {roll.success ? "✅ Sucesso" : "❌ Falha"}
                                                </Typography>
                                            }

                                            {/* Dano */}
                                            {roll.damage !== null && (
                                                <Typography color="#b94927" fontWeight="bold">
                                                    💥 Dano: {roll.damage}
                                                </Typography>
                                            )}

                                            {/* Cura */}
                                            {roll.healing !== null && (
                                                <Typography color="#4caf50" fontWeight="bold">
                                                    💚 Cura: {roll.healing}
                                                </Typography>
                                            )}

                                            {/* Reação */}
                                            {roll.preset && roll.preset.type === "REACT" && roll.combatId != null && roll.turnId != null && (
                                                <Typography fontSize={12} color="#90caf9">
                                                    ⚡ Reação {roll.reacted ? "executada" : "pendente"}
                                                </Typography>
                                            )}

                                            {/* Data */}
                                            <Typography fontSize={11} color="#666">
                                                {new Date(roll.createdAt).toLocaleString()}
                                            </Typography>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            ))}

                            {rolls.length === 0 && (
                                <Typography textAlign="center" color="#888">
                                    Nenhum teste encontrado.
                                </Typography>
                            )}
                        </Stack>
                    )}
                </Stack>
            </Box>
        </Box>
    );
}