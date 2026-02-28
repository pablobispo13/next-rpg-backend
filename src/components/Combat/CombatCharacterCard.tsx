import { Stack, Card, CardContent } from "@mui/material";
import { Character } from "../../types/types";
import { CharacterHeader } from "../Character/CharacterHeader";
import { TurnIndicator } from "../Jogador/TurnIndicator";
import { LifeBar } from "../Jogador/LifeBar";
import { DiceRollButton } from "../Jogador/DiceRollButton";

type Props = {
    character: Character;
    isActiveTurn: boolean;
    onAttack: () => void;
};

export function CombatCharacterCard({
    character,
    isActiveTurn,
    onAttack,
}: Props) {
    return (
        <Card
            sx={{
                width: 280,
                border: isActiveTurn ? "2px solid #4caf50" : undefined,
            }}
        >
            <CardContent>
                <Stack spacing={2}>
                    <Stack direction="row" justifyContent="space-between">
                        <CharacterHeader character={character} />
                        <TurnIndicator isActive={isActiveTurn} />
                    </Stack>

                    <LifeBar life={character.life} maxLife={character.maxLife} />

                    <DiceRollButton
                        label="Ataque"
                        attribute="strength"
                        value={character.strength}
                        onRoll={onAttack}
                    />
                </Stack>
            </CardContent>
        </Card>
    );
}
