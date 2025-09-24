import { Character } from "@/protected/mesa";
import { Card, CardContent, Typography, Button, Box } from "@mui/material";

type Props = {
  character: Character;
  edit?: boolean;
  onEdit?: () => void;
  onView?: () => void;
};

export default function CharacterCard({ character, edit = false, onEdit, onView }: Props) {
  if (!character) return <></>;
  return (
    <Card sx={{ width: 200 }}>
      <CardContent>
        <Typography variant="h6">{character.name}</Typography>
        <Typography>Life: {character.life}</Typography>
        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>

          {edit && (
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
