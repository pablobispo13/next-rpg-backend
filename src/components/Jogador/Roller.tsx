"use client";

import { useState } from "react";
import { Button, IconButton, Stack, Typography } from "@mui/material";
import CasinoIcon from "@mui/icons-material/Casino";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../lib/api";

type Props = {
  actionPresetId: string;
  characterId: string;
  label?: string;
};

export function Roller({ actionPresetId, characterId, label }: Props) {
  const [rolling, setRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);

  async function handleRoll() {
    if (rolling) return;
    setRolling(true);
    try {
      const res = await api.post("/roll", { actionPresetId, characterId });
      setResult(res.data.roll.total);
      setTimeout(() => setResult(null), 6000);
    } finally {
      setRolling(false);
    }
  }

  if (label) {
    return (
      <Button
        variant="outlined"
        size="small"
        onClick={handleRoll}
        disabled={rolling}
        startIcon={<CasinoIcon />}
        sx={{ minWidth: 120 }}
      >
        <Stack alignItems="flex-start" sx={{ lineHeight: 1.2 }}>
          <Typography fontSize={12} fontWeight={600}>{label}</Typography>
          {result !== null && (
            <Typography fontSize={11} color="#fbbf24">→ {result}</Typography>
          )}
        </Stack>
      </Button>
    );
  }

  return (
    <IconButton onClick={handleRoll} disabled={rolling}>
      <AnimatePresence mode="wait">
        {rolling && (
          <motion.div
            key="rolling"
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
          >
            <CasinoIcon fontSize="inherit" />
          </motion.div>
        )}
        {!rolling && result !== null && (
          <motion.div
            key="result"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {result}
          </motion.div>
        )}
        {!rolling && result === null && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <CasinoIcon fontSize="inherit" />
          </motion.div>
        )}
      </AnimatePresence>
    </IconButton>
  );
}