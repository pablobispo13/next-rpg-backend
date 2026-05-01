"use client";

import { Stack, Typography, Paper, Box } from "@mui/material";
import {
  calculateDamageEstimate,
  calculateCriticalDamage,
} from "../../lib/presetUtils";

type Props = {
  impactFormula: string | null | undefined;
  diceFormula: string;
  modifier: number;
  characterAttribute: number;
  critThreshold?: number;
  critMultiplier?: number;
};

export function DamageCalculator({
  impactFormula,
  diceFormula,
  modifier,
  characterAttribute,
  critThreshold = 20,
  critMultiplier = 2,
}: Props) {
  const damage = calculateDamageEstimate(
    impactFormula,
    modifier,
    characterAttribute,
  );

  if (!damage) {
    return null;
  }

  const critDamage = calculateCriticalDamage(damage, critMultiplier);

  return (
    <Paper
      sx={{
        p: 1.5,
        backgroundColor: "rgba(255, 255, 255, 0.05)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: 1,
      }}
    >
      <Stack spacing={1}>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Rolagem:
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontFamily: "monospace", fontWeight: 600 }}
          >
            {diceFormula} {characterAttribute > 0 && `+ ${characterAttribute}`}{" "}
            {modifier > 0 && `+ ${modifier}`}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary">
            Dano Normal:
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Mín:
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#9CA3AF" }}
              >
                {damage.min}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Méd:
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#FBBF24" }}
              >
                {damage.avg}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Máx:
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#FF6B6B" }}
              >
                {damage.max}
              </Typography>
            </Box>
          </Stack>
        </Box>
        <Box sx={{ borderTop: "1px solid rgba(255, 255, 255, 0.1)", pt: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Crítico (≥{critThreshold} × {critMultiplier}):
          </Typography>
          <Stack direction="row" spacing={2} sx={{ mt: 0.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Mín:
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#9CA3AF" }}
              >
                {critDamage.min}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Méd:
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#FBBF24" }}
              >
                {critDamage.avg}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Máx:
              </Typography>
              <Typography
                variant="body2"
                sx={{ fontWeight: 600, color: "#10B981" }}
              >
                {critDamage.max}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Stack>
    </Paper>
  );
}
