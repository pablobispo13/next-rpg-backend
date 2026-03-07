import { Button, Skeleton, Stack, Typography } from "@mui/material";
import { Character } from "../../types/types";

type Props = {
    character: Character;
    typeAction?: "view" | "edit"
    loading?: boolean
    onEditAction?: () => void;
};

export function CharacterHeader({ character, typeAction = "edit", loading = false, onEditAction = () => { } }: Props) {
    return (
        <Stack spacing={0.5}>
            <Typography variant="h6" noWrap>
                {loading ? <Skeleton /> : character.name}
            </Typography>
            {loading ?
                <Typography variant="caption" color="text.secondary">
                    <Skeleton />
                </Typography>
                : character.owner && (
                    <Typography variant="caption" color="text.secondary">
                        {character.owner.username} ({character.owner.role})
                    </Typography>
                )}
            {loading ?
                <Button variant="contained" disabled>
                    <Skeleton width={"100%"} />
                </Button>
                : typeAction == "edit" && (
                    <Button variant="contained" onClick={onEditAction}>
                        Editar Personagem
                    </Button>
                )}
        </Stack>
    );
}
