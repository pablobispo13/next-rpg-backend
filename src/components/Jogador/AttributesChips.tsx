import { Stack, Chip } from "@mui/material";
import { Character, Character_Attributes } from "../../types/types";
type Props = {
    character: Character;
    compact?: boolean;
};

export function AttributesChips({ character, compact }: Props) {
    return (
        <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {Character_Attributes.map(({ key, label }) => (
                <Chip
                    key={key}
                    size={compact ? "small" : "medium"}
                    label={`${label}: ${character[key]}`}
                />
            ))}
        </Stack>
    );
}
