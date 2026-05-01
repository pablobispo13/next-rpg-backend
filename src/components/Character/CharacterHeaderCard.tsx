"use client";

import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Button,
  Skeleton,
  Chip,
  Divider,
} from "@mui/material";
import { Character } from "../../types/types";
import PersonIcon from "@mui/icons-material/Person";
import EditIcon from "@mui/icons-material/Edit";
import ShieldIcon from "@mui/icons-material/Shield";

type Props = {
  character: Character;
  loading?: boolean;
  onEditAction?: () => void;
};

export function CharacterHeaderCard({
  character,
  loading = false,
  onEditAction,
}: Props) {
  return (
    <Card
      sx={{
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: "2px solid rgba(255, 255, 255, 0.1)",
        borderRadius: { xs: 1.5, sm: 2 },
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.3)",
      }}
    >
      <CardContent
        sx={{
          p: { xs: 1.5, sm: 2.5 },
          "&:last-child": { pb: { xs: 1.5, sm: 2.5 } },
        }}
      >
        <Stack spacing={{ xs: 1.5, sm: 2 }}>
          {/* Header Principal */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "flex-start", sm: "flex-start" }}
            justifyContent="space-between"
            gap={1}
          >
            <Stack
              direction="row"
              spacing={{ xs: 1, sm: 1.5 }}
              flex={1}
              minWidth={0}
            >
              {/* Avatar/Icon */}
              <Box
                sx={{
                  fontSize: { xs: "1.5rem", sm: "2rem" },
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "rgba(107, 122, 219, 0.2)",
                  borderRadius: 1,
                  border: "1px solid rgba(107, 122, 219, 0.4)",
                  flexShrink: 0,
                }}
              >
                <PersonIcon
                  sx={{
                    fontSize: { xs: "1rem", sm: "1.5rem" },
                    color: "#6B7ADB",
                  }}
                />
              </Box>

              {/* Informações */}
              <Stack flex={1} minWidth={0}>
                <Typography
                  variant="h6"
                  fontWeight="bold"
                  noWrap
                  sx={{ fontSize: { xs: "1.1rem", sm: "1.25rem" } }}
                >
                  {loading ? <Skeleton width="200px" /> : character.name}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    fontSize: { xs: "0.7rem", sm: "0.75rem" },
                  }}
                >
                  {loading ? (
                    <Skeleton width="150px" />
                  ) : character.owner ? (
                    `${character.owner.username} (${character.owner.role})`
                  ) : (
                    "Sem proprietário"
                  )}
                </Typography>
              </Stack>
            </Stack>

            {/* Editar Button */}
            {onEditAction && !loading && (
              <Button
                size="small"
                startIcon={<EditIcon />}
                onClick={onEditAction}
                sx={{
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                }}
              >
                Editar
              </Button>
            )}
          </Stack>

          <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.1)" }} />

          {/* Stats Secundários */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={{ xs: 1, sm: 1 }}
            flexWrap="wrap"
            useFlexGap
          >
            {/* Defesa */}
            <Chip
              icon={<ShieldIcon />}
              label={
                loading ? (
                  <Skeleton width="50px" />
                ) : (
                  `DEF: ${character.baseDefense}`
                )
              }
              sx={{
                backgroundColor: "rgba(102, 187, 106, 0.2)",
                color: "#66BB6A",
              }}
            />
          </Stack>

          {/* Descrição (se houver) */}
          {character.history && !loading && (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mb={0.5}
              >
                Histórico:
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {character.history}
              </Typography>
            </Box>
          )}
          {character.notes && !loading && (
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                display="block"
                mb={0.5}
              >
                Anotações:
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {character.notes}
              </Typography>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
