"use client";

import { useEffect } from "react";
import { useRouter } from "next/router";
import { CircularProgress, Box, Typography } from "@mui/material";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.push("/front");
  }, [router]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mt: 10 }}>
      <CircularProgress />
      <Typography variant="h6" sx={{ mt: 2 }}>
        Redirecionando para seu painel...
      </Typography>
    </Box>
  );
}
