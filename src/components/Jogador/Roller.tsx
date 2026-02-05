"use client";


import { useState } from "react";
import { IconButton } from "@mui/material";
import CasinoIcon from "@mui/icons-material/Casino";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../lib/api";

type Props = {
  actionPresetId: string;
  characterId: string
};

export function Roller({
  actionPresetId,
  characterId
}: Props) {
  const [rolling, setRolling] = useState(false);
  const [damage, setDamage] = useState<number | null>(null);

  async function rollDamageFromApi(): Promise<number> {
    const result = await api.post("/roll", {
      actionPresetId,
      characterId,
    });
    return result.data.roll.total;
  }
  const handleRoll = async () => {
    if (rolling) return;
    const result = await rollDamageFromApi();
    setDamage(result);
    setRolling(false);
    setTimeout(() => {
      setDamage(null)
      setDamage(null);
    }, 6000)
  };


  return (
    <IconButton
      onClick={handleRoll}
      disabled={rolling}
    >
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
        {!rolling && damage !== null && (
          <motion.div
            key="result"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1.2, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {damage}
          </motion.div>
        )}


        {!rolling && damage === null && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <CasinoIcon fontSize="inherit" />
          </motion.div>
        )}
      </AnimatePresence>
    </IconButton>
  );
}