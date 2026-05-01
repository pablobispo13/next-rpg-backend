"use client";

import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Stack,
  Skeleton,
} from "@mui/material";
import { getLifePercent } from "../../types/types";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";

type Props = {
  life: number;
  maxLife: number;
  loading?: boolean;
};

export function LifeBarCard({ life, maxLife, loading = false }: Props) {
  const percent = getLifePercent(life, maxLife);
  const color =
    percent > 50 ? "#4caf50" : percent > 25 ? "#ff9800" : "#f44336";

  return (
    <Card
      sx={{
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: `2px solid ${loading ? "rgba(255, 255, 255, 0.1)" : color}80`,
        borderRadius: { xs: 1.5, sm: 2 },
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: loading
          ? "0 2px 8px rgba(0, 0, 0, 0.3)"
          : `0 8px 24px ${color}40`,
      }}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2.5 }, "&:last-child": { pb: { xs: 1.5, sm: 2.5 } } }}>
        <Stack spacing={{ xs: 1, sm: 1.5 }}>
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={{ xs: 1, sm: 1.5 }}>
            <Box
              sx={{
                fontSize: { xs: "1.2rem", sm: "1.5rem" },
                width: { xs: 32, sm: 36 },
                height: { xs: 32, sm: 36 },
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${color}20`,
                borderRadius: 1,
                border: `1px solid ${color}40`,
                color,
                flexShrink: 0,
              }}
            >
              <FavoriteBorderIcon />
            </Box>
            <Stack flex={1}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ fontSize: { xs: "0.8rem", sm: "1rem" } }}>
                Vida
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>
                {loading ? (
                  <Skeleton width="100px" />
                ) : (
                  `${life} / ${maxLife}`
                )}
              </Typography>
            </Stack>
            <Typography
              variant="body2"
              fontWeight="bold"
              sx={{ color, minWidth: "45px", textAlign: "right", fontSize: { xs: "0.75rem", sm: "1rem" } }}
            >
              {loading ? <Skeleton width="30px" /> : `${Math.round(percent)}%`}
            </Typography>
          </Stack>

          {/* Progress Bar */}
          <LinearProgress
            variant="determinate"
            value={loading ? 50 : percent}
            sx={{
              height: { xs: 10, sm: 12 },
              borderRadius: 2,
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              "& .MuiLinearProgress-bar": {
                backgroundColor: color,
                borderRadius: 2,
              },
            }}
          />
        </Stack>
      </CardContent>
    </Card>
  );
}
