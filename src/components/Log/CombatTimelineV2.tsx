"use client";

import { Stack, Box, Typography, Collapse, IconButton } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState, useMemo } from "react";
import { ActionLog } from "../../types/types";
import { RollBreakdown } from "./RollBreakdown";
import { TargetResolutionCard } from "./TargetResolutionCard";

interface CombatTimelineV2Props {
  logs: ActionLog[];
}

interface ActionGroup {
  rollId: string;
  presetName: string;
  logs: ActionLog[];
}

export function CombatTimelineV2({ logs }: CombatTimelineV2Props) {
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());

  // Agrupa por rollId para agrupar ações relacionadas
  const groupedByAction = useMemo(() => {
    const groups: Map<string, ActionGroup> = new Map();

    logs.forEach((log) => {
      if (!log.roll) return;

      const key = log.roll.id || log.id;
      if (!groups.has(key)) {
        groups.set(key, {
          rollId: key,
          presetName: log.roll.preset?.name || "Ação",
          logs: [],
        });
      }
      groups.get(key)!.logs.push(log);
    });

    return Array.from(groups.values()).reverse();
  }, [logs]);

  const toggleAction = (rollId: string) => {
    setExpandedActions((prev) => {
      const next = new Set(prev);
      if (next.has(rollId)) {
        next.delete(rollId);
      } else {
        next.add(rollId);
      }
      return next;
    });
  };

  return (
    <Stack spacing={1.5}>
      {groupedByAction.map((action) => {
        const mainLog = action.logs[0];
        const isExpanded = expandedActions.has(action.rollId);

        return (
          <Box
            key={action.rollId}
            sx={{
              backgroundColor: "rgba(255, 255, 255, 0.02)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
              borderRadius: 1.5,
              overflow: "hidden",
            }}
          >
            {/* Action Header */}
            <Box
              sx={{
                p: 1.5,
                backgroundColor: "rgba(107, 114, 219, 0.1)",
                borderBottom: isExpanded ? "1px solid rgba(255, 255, 255, 0.1)" : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                cursor: "pointer",
                transition: "background-color 0.2s",
                "&:hover": {
                  backgroundColor: "rgba(107, 114, 219, 0.15)",
                },
              }}
              onClick={() => toggleAction(action.rollId)}
            >
              <Stack direction="row" alignItems="center" spacing={1.5} flex={1} minWidth={0}>
                <IconButton
                  size="small"
                  sx={{
                    transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s",
                  }}
                >
                  <ExpandMoreIcon fontSize="small" />
                </IconButton>

                <Stack flex={1} minWidth={0}>
                  <Typography variant="body2" fontWeight="500">
                    {mainLog.message}
                  </Typography>
                </Stack>
              </Stack>
            </Box>

            {/* Action Content */}
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Stack sx={{ p: 1.5 }} spacing={1.5}>
                {/* RollBreakdown */}
                {mainLog.roll && (
                  <Box sx={{ backgroundColor: "#1a1a2e", p: 1.5, borderRadius: 1 }}>
                    <RollBreakdown
                      roll={mainLog.roll}
                      succeeded={mainLog.roll.sucess}
                      showDamage={!!mainLog.roll.damage}
                    />
                  </Box>
                )}

                {/* Target Results */}
                {action.logs.length > 1 && (
                  <Stack spacing={1}>
                    <Typography variant="caption" color="text.secondary" fontWeight="600">
                      Resultados por Alvo
                    </Typography>

                    {action.logs
                      .filter((l) => l.id !== action.logs[0].id)
                      .map((l) => (
                        <TargetResolutionCard
                          key={l.id}
                          targetName="Alvo"
                          succeeded={l.roll?.sucess ?? false}
                          critical={false}
                          beforeLife={100}
                          afterLife={100}
                          maxLife={100}
                        />
                      ))}
                  </Stack>
                )}
              </Stack>
            </Collapse>
          </Box>
        );
      })}
    </Stack>
  );
}
