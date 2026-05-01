"use client";

import {
  Stack,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Collapse,
  Divider,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { CharacterInventory } from "../../types/types";
import api from "../../lib/api";
import { useState } from "react";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

type Props = {
  item: CharacterInventory;
  characterId: string;
  canEdit?: boolean;
  onEdit?: () => void;
  onRemove?: () => void;
};

export function InventoryItemCard({
  item,
  characterId,
  canEdit,
  onEdit,
  onRemove,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const handleDelete = async () => {
    await api
      .post("/inventory", {
        action: "delete",
        itemId: item.id,
        characterId,
      })
      .then(() => {
        onRemove?.();
      });
  };

  return (
    <>
      <Card
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        sx={{
          backgroundColor: "rgba(255, 255, 255, 0.03)",
          border: `2px solid ${hovering ? "#34D399" : "rgba(255, 255, 255, 0.1)"}`,
          borderRadius: 2,
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: hovering
            ? "0 8px 24px #34D39940"
            : "0 2px 8px rgba(0, 0, 0, 0.3)",
          cursor: canEdit ? "pointer" : "default",
        }}
        onClick={() => canEdit && setExpanded(!expanded)}
      >
        <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
          {/* Header */}
          <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
            <Box
              sx={{
                fontSize: "1.5rem",
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#34D39920",
                borderRadius: 1,
                border: "1px solid #34D39940",
              }}
            >
              🎒
            </Box>

            <Stack flex={1} minWidth={0}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography fontWeight="bold" variant="subtitle2">
                  {item.name}
                </Typography>
                {item.quantity > 1 && (
                  <Chip
                    label={`x${item.quantity}`}
                    size="small"
                    sx={{
                      backgroundColor: "#34D39930",
                      color: "#34D399",
                      fontWeight: 600,
                    }}
                  />
                )}
              </Stack>
              {item.description && (
                <Typography variant="caption" color="text.secondary" noWrap>
                  {item.description}
                </Typography>
              )}
            </Stack>

            {hovering && canEdit && (
              <Stack direction="row" spacing={0.5}>
                <Button
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit?.();
                  }}
                >
                  Editar
                </Button>
                <Button
                  size="small"
                  color="error"
                  startIcon={<DeleteIcon />}
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenDeleteDialog(true);
                  }}
                >
                  Remover
                </Button>
              </Stack>
            )}
          </Stack>

          {/* Expandir */}
          {item.description && canEdit && (
            <Box
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              sx={{
                mt: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                opacity: 0.6,
                transition: "opacity 0.2s",
                "&:hover": { opacity: 1 },
              }}
            >
              <ExpandMoreIcon
                sx={{
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.3s",
                  fontSize: "1.2rem",
                }}
              />
            </Box>
          )}

          {/* Descrição Expandida */}
          <Collapse in={expanded} timeout="auto" unmountOnExit>
            <Divider sx={{ my: 1, borderColor: "rgba(255, 255, 255, 0.1)" }} />
            <Typography variant="body2" color="text.secondary">
              {item.description}
            </Typography>
          </Collapse>
        </CardContent>
      </Card>
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja deletar <strong>{item.name}</strong>? Esta
            ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Deletar
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
