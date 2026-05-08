"use client";

import { Card, CardContent, Stack, Typography, Box, LinearProgress, Chip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";

interface TargetResolutionCardProps {
  targetName: string;
  succeeded: boolean;
  critical?: boolean;
  beforeLife: number;
  afterLife: number;
  maxLife: number;
  damageApplied?: number;
  healingApplied?: number;
}

export function TargetResolutionCard({
  targetName,
  succeeded,
  critical = false,
  beforeLife,
  afterLife,
  maxLife,
  damageApplied,
  healingApplied,
}: TargetResolutionCardProps) {
  const successColor = succeeded ? "#4ade80" : "#f87171";
  const successIcon = succeeded ? <CheckCircleIcon /> : <CancelIcon />;
  const lifeChange = afterLife - beforeLife;
  const lifePercentBefore = (beforeLife / maxLife) * 100;
  const lifePercentAfter = (afterLife / maxLife) * 100;

  const getLifeColor = (percent: number) => {
    if (percent > 50) return "#4ade80";
    if (percent > 25) return "#fbbf24";
    return "#f87171";
  };

  return (
    <Card
      sx={{
        backgroundColor: "rgba(255, 255, 255, 0.02)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        borderRadius: 1.5,
        transition: "all 0.2s",
        "&:hover": {
          backgroundColor: "rgba(255, 255, 255, 0.04)",
          borderColor: "rgba(255, 255, 255, 0.2)",
        },
      }}
    >
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        {/* Header com nome e status */}
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1.5}>
          <Typography variant="subtitle2" fontWeight="600">
            {targetName}
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            {critical && (
              <Chip
                icon={<LocalFireDepartmentIcon />}
                label="Crítico"
                size="small"
                sx={{
                  backgroundColor: "#f97316",
                  color: "white",
                }}
              />
            )}

            <Chip
              icon={successIcon}
              label={succeeded ? "Acertou" : "Falhou"}
              size="small"
              sx={{
                backgroundColor: `${successColor}20`,
                color: successColor,
                fontWeight: "bold",
              }}
            />
          </Stack>
        </Stack>

        {/* Vida antes/depois */}
        <Box sx={{ mb: 1.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
            <Typography variant="caption" color="text.secondary">
              Vida
            </Typography>
            <Typography
              variant="caption"
              fontWeight="600"
              sx={{
                color: getLifeColor(lifePercentAfter),
              }}
            >
              {beforeLife} → {afterLife} {lifeChange > 0 ? `(+${lifeChange})` : `(${lifeChange})`}
            </Typography>
          </Stack>

          {/* Before/After visual */}
          <Stack spacing={0.5}>
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>
                Antes
              </Typography>
              <LinearProgress
                variant="determinate"
                value={lifePercentBefore}
                sx={{
                  height: 6,
                  borderRadius: 1,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: getLifeColor(lifePercentBefore),
                    borderRadius: 1,
                  },
                }}
              />
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>
                Depois
              </Typography>
              <LinearProgress
                variant="determinate"
                value={lifePercentAfter}
                sx={{
                  height: 6,
                  borderRadius: 1,
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  "& .MuiLinearProgress-bar": {
                    backgroundColor: getLifeColor(lifePercentAfter),
                    borderRadius: 1,
                  },
                }}
              />
            </Box>
          </Stack>
        </Box>

        {/* Dano aplicado */}
        {damageApplied && damageApplied > 0 && (
          <Box sx={{ p: 1, backgroundColor: "#f8717120", borderRadius: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: "#f87171",
                fontWeight: 600,
              }}
            >
              🗡️ {damageApplied} de dano aplicado
            </Typography>
          </Box>
        )}

        {/* Cura aplicada */}
        {healingApplied && healingApplied > 0 && (
          <Box sx={{ p: 1, backgroundColor: "#4ade8020", borderRadius: 1 }}>
            <Typography
              variant="caption"
              sx={{
                color: "#4ade80",
                fontWeight: 600,
              }}
            >
              💚 {healingApplied} de cura aplicada
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
