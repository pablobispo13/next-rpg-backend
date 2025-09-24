// pages/login.tsx
import { Container, Tabs, Tab, Box, TextField, Button } from "@mui/material";
import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLoginForm, useRegisterForm } from "../hooks/useAuthForms";
import { useRouter } from "next/router";

export default function LoginPage() {
  const { login, register } = useAuth();
  const [tab, setTab] = useState(0);

  const { register: loginRegister, handleSubmit: handleLoginSubmit, formState: { errors: loginErrors } } = useLoginForm();
  const { register: registerRegister, handleSubmit: handleRegisterSubmit, formState: { errors: registerErrors } } = useRegisterForm();

  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) router.push("/login"); // redireciona se não estiver logado
    else if (user) router.push("/protected/mesa")
  }, [user, router]);

  return (
    <Container sx={{ mt: 8 }}>
      <Tabs value={tab} onChange={(_, val) => setTab(val)}>
        <Tab label="Login" />
        <Tab label="Registro" />
      </Tabs>

      <Box sx={{ mt: 4 }}>
        {tab === 0 ? (
          <form onSubmit={handleLoginSubmit(({ email, password }) => login(email, password))}>
            <TextField label="Email" fullWidth margin="normal" {...loginRegister("email")} error={!!loginErrors.email} helperText={loginErrors.email?.message} />
            <TextField label="Senha" type="password" fullWidth margin="normal" {...loginRegister("password")} error={!!loginErrors.password} helperText={loginErrors.password?.message} />
            <Button variant="contained" sx={{ mt: 2 }} type="submit">Entrar</Button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit(({ username, email, password }) => register(username, email, password))}>
            <TextField label="Nome" fullWidth margin="normal" {...registerRegister("username")} error={!!registerErrors.username} helperText={registerErrors.username?.message} />
            <TextField label="Email" fullWidth margin="normal" {...registerRegister("email")} error={!!registerErrors.email} helperText={registerErrors.email?.message} />
            <TextField label="Senha" type="password" fullWidth margin="normal" {...registerRegister("password")} error={!!registerErrors.password} helperText={registerErrors.password?.message} />
            <Button variant="contained" sx={{ mt: 2 }} type="submit">Registrar</Button>
          </form>
        )}
      </Box>
    </Container>
  );
}
