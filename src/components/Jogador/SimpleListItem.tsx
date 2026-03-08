import { Box, IconButton, Stack } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

type Props = {
    children: React.ReactNode;
    editable?: boolean;
    buttonAction?: React.ReactNode
    presetType?: "SKILL" | "ATTACK" | "TEST" | "REACT" | "SUPPORT"
    onEdit?: () => void;
    onDelete?: () => void;
};

const presetColors = {
    ATTACK: "#2e1f1f",
    SKILL: "#948451",
    TEST: "#6D6D6D",
    REACT: "#206461",
    SUPPORT: "#2E7D32",
};

export function SimpleListItem({
    children,
    buttonAction = <></>,
    editable = false,
    presetType,
    onEdit,
    onDelete,
}: Props) {
    return (
        <Box
            sx={{
                backgroundColor: presetType ? presetColors[presetType] : "#2e2e4d", p: 1, borderRadius: 1,
            }}
        >
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
            >
                {children}
                <Stack direction="row" spacing={0.5}>
                    {buttonAction}
                    {editable &&
                        onEdit && (
                            <IconButton size="small" onClick={onEdit}>
                                <EditIcon fontSize="small" />
                            </IconButton>
                        )}

                    {onDelete && (
                        <IconButton
                            size="small"
                            color="error"
                            onClick={onDelete}
                        >
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    )}
                </Stack>
            </Stack>
        </Box>
    );
}
