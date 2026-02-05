import { Stack, Typography } from "@mui/material";

type Log = {
  id: string;
  message: string;
};

type Props = {
  logs: Log[];
};

export function ActionLogList({ logs }: Props) {
  return (
    <Stack spacing={1}>
      {logs.map((log) => (
        <Typography
          key={log.id}
          sx={{
            backgroundColor: "#2e2e2e",
            p: 1,
            borderRadius: 1,
            fontSize: 14,
          }}
        >
          {log.message}
        </Typography>
      ))}
    </Stack>
  );
}
