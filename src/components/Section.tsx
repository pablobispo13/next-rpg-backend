import { Box, Typography, Stack } from "@mui/material";

type Props = {
    title: string;
    children: React.ReactNode;
    action?: React.ReactNode;
};

export function Section({ title, children, action }: Props) {
    return (
        <Box>
            <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{
                    mb: 2,
                    borderBottom: "1px solid #444",
                    pb: 0.5,
                }}
            >
                <Typography variant="h5">
                    {title}
                </Typography>

                {action && <Box>{action}</Box>}
            </Stack>

            {children}
        </Box>
    );
}
