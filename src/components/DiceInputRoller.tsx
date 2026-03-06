"use client";

import { useState } from "react";
import { TextField, IconButton, Box } from "@mui/material";
import CasinoIcon from "@mui/icons-material/Casino";
import { motion, AnimatePresence } from "framer-motion";
import api from "../lib/api";

type Props = {
    characterId: string;
};

export function DiceInputRoller({ characterId }: Props) {
    const [formula, setFormula] = useState("1d20");
    const [rolling, setRolling] = useState(false);
    const [result, setResult] = useState<number | null>(null);

    async function rollFromApi(): Promise<number> {
        const res = await api.post("/roll", {
            characterId,
            diceFormula: formula,
            logMessage: `Rolagem manual ${formula}`,
        });

        return res.data.roll.total;
    }

    const handleRoll = async () => {
        if (rolling) return;

        setRolling(true);

        try {
            const value = await rollFromApi();
            setResult(value);
        } catch (err) {
            console.error("Erro ao rolar dado", err);
        }

        setRolling(false);

        setTimeout(() => {
            setResult(null);
        }, 5000);
    };

    return (
        <Box display="flex" gap={1} alignItems="center">
            <TextField
                size="small"
                label="Rolagem"
                value={formula}
                onChange={(e) => setFormula(e.target.value)}
                sx={{ width: 120 }}
            />

            <IconButton onClick={handleRoll} disabled={rolling}>
                <AnimatePresence mode="wait">
                    {rolling && (
                        <motion.div
                            key="rolling"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                        >
                            <CasinoIcon />
                        </motion.div>
                    )}

                    {!rolling && result !== null && (
                        <motion.div
                            key="result"
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1.3, opacity: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                        >
                            {result}
                        </motion.div>
                    )}

                    {!rolling && result === null && (
                        <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <CasinoIcon />
                        </motion.div>
                    )}
                </AnimatePresence>
            </IconButton>
        </Box>
    );
}