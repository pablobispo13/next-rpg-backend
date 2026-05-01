import {
  Button,
  Stack,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { ActionPreset } from "@prisma/client";
import api from "../../lib/api";
import { SimpleListItem } from "../Jogador/SimpleListItem";
import {
  getActionColor,
  getActionIcon,
  getActionName,
  formatPresetDisplay,
} from "../../lib/presetUtils";
import { useState } from "react";

type Props = {
  preset: ActionPreset;
  characterAttribute?: number;
  canEdit?: boolean;
  onEdit: () => void;
};

export function PresetRow({
  preset,
  characterAttribute = 0,
  canEdit,
  onEdit,
}: Props) {
  const handleDelete = async () => {
    await api.delete(`/actionPreset/${preset.id}`);
  };

  const color = getActionColor(preset.type);
  const icon = getActionIcon(preset.type);
  const actionName = getActionName(preset.type);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const displayText = formatPresetDisplay(
    preset.diceFormula,
    preset.impactFormula,
    preset.modifier,
    characterAttribute,
    preset.attribute,
  );

  return (
    <>
      <SimpleListItem>
        <Stack
          direction="row"
          justifyContent="space-between"
          width="100%"
          alignItems="center"
        >
          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            flex={1}
            minWidth={0}
          >
            {/* Ícone com cor */}
            <Box
              sx={{
                fontSize: "1.2rem",
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: `${color}20`,
                borderRadius: 0.75,
                border: `1px solid ${color}40`,
                flexShrink: 0,
              }}
            >
              {icon}
            </Box>

            {/* Informações */}
            <Stack flex={1} minWidth={0}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography fontWeight="bold" variant="subtitle2">
                  {preset.name}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    px: 0.75,
                    py: 0.25,
                    borderRadius: 0.5,
                    backgroundColor: `${color}30`,
                    color: color,
                    fontWeight: 600,
                    flexShrink: 0,
                  }}
                >
                  {actionName}
                </Typography>
              </Stack>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontFamily: "monospace" }}
              >
                {displayText}
              </Typography>
            </Stack>
          </Stack>

          {/* Botões */}
          {canEdit && (
            <Stack direction="row" spacing={0.5}>
              <Button size="small" onClick={onEdit}>
                Editar
              </Button>
              <Button
                size="small"
                color="error"
                onClick={() => {
                  setOpenDeleteDialog(true);
                }}
              >
                Remover
              </Button>
            </Stack>
          )}
        </Stack>
      </SimpleListItem>
      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja deletar <strong>{preset.name}</strong>? Esta
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
