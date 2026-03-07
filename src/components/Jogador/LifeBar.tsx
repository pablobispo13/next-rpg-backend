import { Box, Typography, LinearProgress, Skeleton } from "@mui/material";
import { getLifePercent } from "../../types/types";

type Props = {
    life: number;
    maxLife: number;
    loading?: boolean
};

export function LifeBar({ life, maxLife, loading = false }: Props) {
    const percent = getLifePercent(life, maxLife);

    return (
        <Box>
            <Typography variant="body2" display={"flex"} gap={1}>
                Vida: {loading ? <Skeleton width={"15px"} /> : life}/{loading ? <Skeleton width={"15px"} /> : maxLife}
            </Typography>

            <LinearProgress
                variant="determinate"
                value={loading ? 50 : percent}
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
