import { Button, Stack, Typography } from "@mui/material";
import { Character } from "../../types/types";

type Props = {
    character: Character;
    typeAction?: "view" | "edit"
    onEditAction?: () => void;
};

export function CharacterHeader({ character, typeAction = "edit", onEditAction = () => { } }: Props) {
    return (
        <Stack spacing={0.5}>
            <Typography variant="h6" noWrap>
                {character.name}
            </Typography>

            {character.owner && (
                <Typography variant="caption" color="text.secondary">
                    {character.owner.username} ({character.owner.role})
                </Typography>
            )}
            {typeAction == "edit" && (
                <Button variant="contained" onClick={onEditAction}>
                    Editar Personagem
                </Button>
            )}
        </Stack>
    );
}
