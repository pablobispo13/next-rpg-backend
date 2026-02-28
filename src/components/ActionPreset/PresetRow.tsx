import { Button, Stack } from "@mui/material";
import { ActionPreset } from "@prisma/client";
import api from "../../lib/api";
import { SimpleListItem } from "../Jogador/SimpleListItem";

type Props = {
  preset: ActionPreset;
  canEdit?: boolean;
  onEdit: () => void;
};

export function PresetRow({ preset, canEdit, onEdit }: Props) {
  const handleDelete = async () => {
    await api.delete(`/actionPreset/${preset.id}`);
  };

  return (
    <SimpleListItem>
      <Stack direction="row" justifyContent="space-between" width="100%">
        <span>{preset.name} ({preset.diceFormula})</span>

        {canEdit && (
          <Stack direction="row" spacing={1}>
            <Button size="small" onClick={onEdit}>Editar</Button>
            <Button size="small" color="error" onClick={handleDelete}>Remover</Button>
          </Stack>
        )}
      </Stack>
    </SimpleListItem>
  );
}
