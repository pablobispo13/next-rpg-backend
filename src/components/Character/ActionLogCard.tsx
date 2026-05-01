"use client";

import { Stack, Card, CardContent, Typography, Box } from "@mui/material";
import { ActionLog } from "../../types/types";
import HistoryIcon from "@mui/icons-material/History";
import { useState } from "react";

type Props = {
  actionLog: ActionLog;
};

export function ActionLogCard({ actionLog }: Props) {
  const [hovering, setHovering] = useState(false);

  const color = "#6B7ADB";
  const isRoll =
    actionLog.type !== "TURN_START" &&
    actionLog.type !== "COMBAT_START" &&
    actionLog.type !== "COMBAT_END" &&
    actionLog.type !== "TURN_END";

  if (!isRoll) return null;

  return (
    <Card
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      sx={{
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: `2px solid ${hovering ? color : "rgba(255, 255, 255, 0.1)"}`,
        borderRadius: 2,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: hovering ? `0 8px 24px ${color}40` : "0 2px 8px rgba(0, 0, 0, 0.3)",
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
          <Box
            sx={{
              fontSize: "1.5rem",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${color}20`,
              borderRadius: 1,
              border: `1px solid ${color}40`,
            }}
          >
            <HistoryIcon fontSize="small" />
          </Box>

          <Stack flex={1} minWidth={0}>
            <Typography fontWeight="bold" variant="subtitle2">
              {actionLog.message}
            </Typography>
            {actionLog.roll && (
              <Typography variant="caption" color="text.secondary" sx={{ fontFamily: "monospace" }}>
                {actionLog.roll.preset?.diceFormula}
                {actionLog.roll.preset?.modifier ? ` + ${actionLog.roll.preset.modifier}` : ""}
                {" = "}
                <span style={{ color }}>{actionLog.roll.total}</span>
              </Typography>
            )}
          </Stack>
        </Stack>

        {actionLog.roll?.preset && (
          <Stack spacing={1} sx={{ mt: 1.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Habilidade:
              </Typography>
              <Typography variant="body2" fontWeight="500">
                {actionLog.roll.preset.name}
              </Typography>
            </Box>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
