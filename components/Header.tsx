"use client";
import { AppBar, Toolbar, Typography, Button } from "@mui/material";
import { useRouter } from "next/router";

export default function Header() {
  const router = useRouter();

  const logout = () => {
    localStorage.clear();
    router.push("/");
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>RPG System</Typography>
        <Button color="inherit" onClick={logout}>Sair</Button>
      </Toolbar>
    </AppBar>
  );
}
