import { Chip } from "@mui/material";

type Props = {
    isActive: boolean;
};

export function TurnIndicator({ isActive }: Props) {
    if (!isActive) return null;

    return (
        <Chip
            label="Turno Atual"
            color="success"
            size="small"
            sx={{ fontWeight: "bold" }}
        />
    );
}
