import { Box, Typography, Stack, Divider } from "@mui/material";

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
          mb: 2.5,
          pb: 1.5,
          position: "relative",
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1} flex={1}>
          <Box
            sx={{
              width: 4,
              height: 24,
              backgroundColor: "rgba(107, 122, 219, 0.6)",
              borderRadius: 2,
              transition: "all 0.3s ease",
            }}
          />
          <Typography
            variant="h6"
            sx={{
              fontWeight: "bold",
              background: "linear-gradient(135deg, #6B7ADB, #8B9DFF)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              letterSpacing: "0.5px",
            }}
          >
            {title}
          </Typography>
        </Stack>
        {action && <Box>{action}</Box>}
        <Divider
          sx={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            borderColor: "rgba(107, 122, 219, 0.2)",
            transition: "all 0.3s ease",
          }}
        />
      </Stack>

      {children}
    </Box>
  );
}
