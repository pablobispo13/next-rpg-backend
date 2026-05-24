"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Box, Button, Card, CardContent, Stack, TextField, Typography, CircularProgress } from "@mui/material";
import { toast } from "react-toastify";
import api from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { useCampaign } from "../../context/CampaignContext";

const PENDING_INVITE_KEY = "pending_invite_code";

export default function JoinPage() {
  const router = useRouter();
  const params = useSearchParams();
  const codeFromUrl = (params.get("code") || "").toUpperCase();
  const { user, loading: authLoading } = useAuth();
  const { reload } = useCampaign();

  const [code, setCode] = useState(codeFromUrl);
  const [submitting, setSubmitting] = useState(false);
  const [autoTried, setAutoTried] = useState(false);

  // Se não está autenticado, salva o código e redireciona pra login
  useEffect(() => {
    if (authLoading) return;
    if (user) return;
    if (codeFromUrl) {
      localStorage.setItem(PENDING_INVITE_KEY, codeFromUrl);
    }
    router.replace("/login");
  }, [authLoading, user, codeFromUrl, router]);

  // Se vier código pela URL e o usuário estiver autenticado, tenta entrar automaticamente
  useEffect(() => {
    if (!codeFromUrl || autoTried || authLoading || !user) return;
    setAutoTried(true);
    handleJoin(codeFromUrl);
  }, [codeFromUrl, autoTried, authLoading, user]);

  async function handleJoin(value: string) {
    const trimmed = value.trim().toUpperCase();
    if (trimmed.length !== 6) {
      toast.error("Código deve ter 6 caracteres");
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await api.post("/campaigns/join", { code: trimmed });
      toast.success(data.alreadyMember ? "Você já era membro" : `Entrou em ${data.campaignName}`);
      localStorage.removeItem(PENDING_INVITE_KEY);
      // Marca a mesa recém-entrada como ativa antes do reload (que vai resolver pelo savedId)
      localStorage.setItem("activeCampaignId", data.campaignId);
      await reload();
      router.replace("/protected/");
    } catch {
      // Em caso de erro (convite expirado, etc) também limpa pra não ficar tentando
      localStorage.removeItem(PENDING_INVITE_KEY);
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, maxWidth: 500, mx: "auto", color: "#cdd1e0" }}>
      <Card sx={{ background: "#16162a", border: "1px solid rgba(107,122,219,0.20)" }}>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h5" sx={{ color: "#8B9DFF" }}>
              Entrar na mesa
            </Typography>
            <Typography variant="body2" sx={{ color: "#888" }}>
              {codeFromUrl
                ? "Aceite o convite para entrar."
                : "Digite o código de convite que você recebeu."}
            </Typography>
            <TextField
              label="Código"
              fullWidth
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              autoFocus={!codeFromUrl}
              inputProps={{ maxLength: 6 }}
              sx={{ "& input": { letterSpacing: 3, textAlign: "center", fontWeight: 700, fontSize: 22 } }}
            />
            <Stack direction="row" spacing={1} justifyContent="flex-end">
              <Button onClick={() => router.push("/protected/mesas")} disabled={submitting}>
                Cancelar
              </Button>
              <Button
                variant="contained"
                onClick={() => handleJoin(code)}
                disabled={submitting || code.trim().length !== 6}
              >
                {submitting ? <CircularProgress size={20} /> : "Entrar"}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
