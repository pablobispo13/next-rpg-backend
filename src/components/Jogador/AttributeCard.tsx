"use client";

import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Skeleton,
} from "@mui/material";
import { Character, Character_Attributes } from "../../types/types";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import SpeedIcon from "@mui/icons-material/Speed";
import FavoriteIcon from "@mui/icons-material/Favorite";
import SchoolIcon from "@mui/icons-material/School";
import EmojiPeopleIcon from "@mui/icons-material/EmojiPeople";
import { useState } from "react";

type Props = {
  character: Character;
  loading?: boolean;
};

const attributeConfig: Record<
  string,
  { icon: React.ReactNode; color: string; label: string }
> = {
  strength: { icon: <FitnessCenterIcon />, color: "#EF5350", label: "Força" },
  agility: { icon: <SpeedIcon />, color: "#29B6F6", label: "Agilidade" },
  vigor: { icon: <FavoriteIcon />, color: "#66BB6A", label: "Vigor" },
  intellect: { icon: <SchoolIcon />, color: "#AB47BC", label: "Inteligência" },
  presence: { icon: <EmojiPeopleIcon />, color: "#FFA726", label: "Presença" },
};

export function AttributeCard({ character, loading = false }: Props) {
  return (
    <Grid container spacing={{ xs: 1, sm: 1.5 }}>
      {Character_Attributes.map(({ key, label }) => {
        const config = attributeConfig[key];
        const value = character[key] || 0;
        const [hovering, setHovering] = useState(false);

        return (
          <Grid key={key}>
            <Card
              onMouseEnter={() => setHovering(true)}
              onMouseLeave={() => setHovering(false)}
              sx={{
                backgroundColor: "rgba(255, 255, 255, 0.03)",
                border: `2px solid ${hovering ? config.color : "rgba(255, 255, 255, 0.1)"}`,
                borderRadius: 2,
                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                boxShadow: hovering
                  ? `0 8px 24px ${config.color}40`
                  : "0 2px 8px rgba(0, 0, 0, 0.3)",
                height: "100%",
              }}
            >
              <CardContent
                sx={{
                  p: 1.5,
                  "&:last-child": { pb: 1.5 },
                  textAlign: "center",
                }}
              >
                <Box
                  sx={{
                    fontSize: "1.5rem",
                    width: 40,
                    height: 40,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: `${config.color}20`,
                    borderRadius: 1,
                    border: `1px solid ${config.color}40`,
                    margin: "0 auto 0.75rem",
                    color: config.color,
                  }}
                >
                  {config.icon}
                </Box>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                  mb={0.5}
                >
                  {label}
                </Typography>
                {loading ? (
                  <Skeleton width="50%" sx={{ mx: "auto" }} />
                ) : (
                  <Typography
                    variant="h5"
                    fontWeight="bold"
                    sx={{ color: config.color }}
                  >
                    {value}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        );
      })}
    </Grid>
  );
}
