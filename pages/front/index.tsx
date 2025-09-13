"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Tabs, Tab, Box, TextField, Button } from "@mui/material";
import axios from "axios";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState(0);
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      const { data } = await axios.post("/api/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("userId", data.user.id);

      router.push("/front/mesa");
    } catch (err: any) {// eslint-disable-line @typescript-eslint/no-explicit-any
      alert(err.response?.data?.message || "Erro ao logar");
    }
  };

  const handleRegister = async () => {
    try {
      const { data } = await axios.post("/api/auth/register", { username, email, password });
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.user.role);
      localStorage.setItem("userId", data.user.id);

      router.push("/front/mesa");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      alert(err.response?.data?.message || "Erro ao registrar");
    }
  };

  return (
    <Container sx={{ mt: 8 }}>
      <Tabs value={tab} onChange={(_, val) => setTab(val)}>
        <Tab label="Login" />
        <Tab label="Registro" />
      </Tabs>
      <Box sx={{ mt: 4 }}>
        {tab === 0 ? (
          <>
            <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth margin="normal" />
            <TextField label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth margin="normal" />
            <Button variant="contained" sx={{ mt: 2 }} onClick={handleLogin}>Entrar</Button>
          </>
        ) : (
          <>
            <TextField label="Nome" value={username} onChange={(e) => setUsername(e.target.value)} fullWidth margin="normal" />
            <TextField label="Email" value={email} onChange={(e) => setEmail(e.target.value)} fullWidth margin="normal" />
            <TextField label="Senha" type="password" value={password} onChange={(e) => setPassword(e.target.value)} fullWidth margin="normal" />
            <Button variant="contained" sx={{ mt: 2 }} onClick={handleRegister}>Registrar</Button>
          </>
        )}
      </Box>
    </Container>
  );
}
