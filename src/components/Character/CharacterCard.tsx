import { Card, CardContent, CardActions, Stack, Button } from "@mui/material";
import { Character } from "../../types/types";
import { LifeBar } from "../Jogador/LifeBar";
import { AttributesChips } from "../Jogador/AttributesChips";
import { CharacterHeader } from "./CharacterHeader";

type Props = {
  character: Character;
  onAcess: () => void;
};

export function CharacterCard({ character, onAcess = () => { }, }: Props) {
  return (
    <Card sx={{ width: 260, display: "flex", flexDirection: "column" }}>
      <CardContent>
        <Stack spacing={2}>
          <CharacterHeader typeAction="view" character={character} />
          <LifeBar life={character.life} maxLife={character.maxLife} />
          <AttributesChips character={character} compact />
        </Stack>
      </CardContent>
      <CardActions>
        <Button variant="contained" onClick={() => onAcess()}>
          Acessar ficha do jogador
        </Button>
      </CardActions>
    </Card>
  );
}
