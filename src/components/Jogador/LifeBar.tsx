import { Box, Typography, LinearProgress } from "@mui/material";
import { getLifePercent } from "../../types/types";

type Props = {
    life: number;
    maxLife: number;
};

export function LifeBar({ life, maxLife }: Props) {
    const percent = getLifePercent(life, maxLife);

    return (
        <Box>
            <Typography variant="body2">
                Vida: {life}/{maxLife}
            </Typography>

            <LinearProgress
                variant="determinate"
                value={percent}
                sx={{
                    height: 10,
                    borderRadius: 5,
                    backgroundColor: "#2e2e2e",
                    "& .MuiLinearProgress-bar": {
                        backgroundColor:
                            percent > 50
                                ? "#4caf50"
                                : percent > 25
                                    ? "#ff9800"
                                    : "#f44336",
                    },
                }}
            />
        </Box>
    );
}
