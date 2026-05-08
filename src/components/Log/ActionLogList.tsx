import { Stack, Typography, Box, Collapse, IconButton } from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useState, useMemo } from "react";

type Log = {
  id: string;
  type: string;
  message: string;
};

type Props = {
  logs: Log[];
};

interface LogGroup {
  type: string;
  logs: Log[];
  emoji: string;
  color: string;
}

const LOG_TYPE_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
  ROLL: { emoji: "🎲", color: "#fbbf24", label: "Rolagem" },
  DAMAGE: { emoji: "🗡️", color: "#f87171", label: "Dano" },
  HEAL: { emoji: "💚", color: "#4ade80", label: "Cura" },
  HEAL_OVER_TIME: { emoji: "💚", color: "#4ade80", label: "Cura Contínua" },
  DAMAGE_OVER_TIME: { emoji: "☠️", color: "#f87171", label: "Dano Contínuo" },
  MANUAL_OVERRIDE: { emoji: "⚙️", color: "#fbbf24", label: "Efeito" },
  REACTION: { emoji: "⚡", color: "#60a5fa", label: "Reação" },
  TURN_START: { emoji: "📍", color: "#9333ea", label: "Início do Turno" },
  TURN_END: { emoji: "🛑", color: "#9333ea", label: "Fim do Turno" },
  COMBAT_START: { emoji: "⚔️", color: "#f97316", label: "Início do Combate" },
  COMBAT_END: { emoji: "🏁", color: "#f97316", label: "Fim do Combate" },
};

export function ActionLogList({ logs }: Props) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const groupedLogs = useMemo(() => {
    const groups: Map<string, LogGroup> = new Map();

    logs.forEach((log) => {
      const config = LOG_TYPE_CONFIG[log.type] || {
        emoji: "📝",
        color: "#888",
        label: log.type,
      };

      if (!groups.has(log.type)) {
        groups.set(log.type, {
          type: log.type,
          logs: [],
          emoji: config.emoji,
          color: config.color,
        });
      }

      groups.get(log.type)!.logs.push(log);
    });

    return Array.from(groups.values());
  }, [logs]);

  const toggleGroup = (type: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  return (
    <Stack spacing={1}>
      {groupedLogs.map((group) => {
        const isExpanded = expandedGroups.has(group.type);
        const config = LOG_TYPE_CONFIG[group.type];

        return (
          <Box key={group.type}>
            {/* Group Header */}
            <Box
              onClick={() => toggleGroup(group.type)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 1.2,
                backgroundColor: `${group.color}15`,
                border: `1px solid ${group.color}40`,
                borderRadius: 1,
                cursor: "pointer",
                transition: "all 0.2s",
                "&:hover": {
                  backgroundColor: `${group.color}25`,
                  borderColor: `${group.color}60`,
                },
              }}
            >
              <IconButton
                size="small"
                sx={{
                  transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s",
                  p: 0,
                }}
              >
                <ExpandMoreIcon fontSize="small" />
              </IconButton>

              <Typography sx={{ color: group.color, fontWeight: 600, flex: 1 }}>
                {group.emoji} {config?.label || group.type}
              </Typography>

              <Typography
                variant="caption"
                sx={{ color: group.color, fontWeight: 600 }}
              >
                ({group.logs.length})
              </Typography>
            </Box>

            {/* Group Items */}
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              <Stack spacing={0.5} sx={{ pl: 1.5, mt: 0.5 }}>
                {group.logs.map((log) => (
                  <Box
                    key={log.id}
                    sx={{
                      p: 1,
                      backgroundColor: `${group.color}10`,
                      border: `1px solid ${group.color}30`,
                      borderRadius: 0.75,
                      borderLeft: `3px solid ${group.color}`,
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: "#fff",
                        fontFamily: "monospace",
                        fontSize: 12,
                      }}
                    >
                      {group.emoji} {log.message}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Collapse>
          </Box>
        );
      })}

      {logs.length === 0 && (
        <Typography textAlign="center" color="#888" variant="caption">
          Nenhum log disponível.
        </Typography>
      )}
    </Stack>
  );
}
