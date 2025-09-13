import { Card, CardContent, Typography, Button, Box } from "@mui/material";

type Character = {
  id: string;
  name: string;
  life: number;
  xp: number;
  agility: number;
  strength: number;
  vigor: number;
  presence: number;
  intellect: number;
  ownerId: string;
  owner?: { username: string };
};

type Props = {
  character: Character;
  canEdit?: boolean; // se o jogador pode editar
  onEdit?: () => void;
  onView?: () => void;
};

export default function CharacterCard({ character, canEdit = false, onEdit, onView }: Props) {
  return (
    <Card sx={{ width: 200 }}>
      <CardContent>
        <Typography variant="h6">{character.name}</Typography>
        <Typography>Life: {character.life}</Typography>
        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
          {canEdit && onEdit && (
            <Button size="small" variant="contained" onClick={onEdit}>
              Editar
            </Button>
          )}
          {onView && (
            <Button size="small" variant="outlined" onClick={onView}>
              Visualizar
            </Button>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
