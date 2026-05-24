"use client";

import { useAuth } from "../../context/AuthContext";
import { useCampaign } from "../../context/CampaignContext";
import { useRouter, useSearchParams } from "next/navigation";
import Mestre from "./mestre";
import Jogador from "./jogador";
import { handleLogout } from "../../lib/api";
import { useEffect, useState } from "react";

export default function Mesa() {
  const { user } = useAuth();
  const { activeCampaign, loading: campaignLoading } = useCampaign();
  const router = useRouter();
  const searchParams = useSearchParams();
  const MAX_TENTATIVAS = 3;
  const INTERVALO_MS = 500;
  const [tentativas, setTentativas] = useState(0);

  useEffect(() => {
    if (user) {
      setTentativas(0);
      return;
    }

    if (tentativas >= MAX_TENTATIVAS) {
      handleLogout("expired");
      return;
    }

    const timer = setTimeout(() => {
      setTentativas((prev) => prev + 1);
    }, INTERVALO_MS);

    return () => clearTimeout(timer);
  }, [user, tentativas]);

  // Sem mesa ativa: redireciona pra tela de seleção/criação
  useEffect(() => {
    if (!user || campaignLoading) return;
    if (!activeCampaign) router.replace("/protected/mesas");
  }, [user, campaignLoading, activeCampaign, router]);

  if (!user || campaignLoading) {
    return <>Carregando...</>;
  }
  if (!activeCampaign) {
    return <>Redirecionando para seleção de mesa…</>;
  }

  const view = searchParams.get("view");
  const characterId = searchParams.get("characterId");
  // key={activeCampaign.id} força re-mount ao trocar de mesa, recarregando todos os fetches
  if (user.role === "MESTRE" && view === "jogador") {
    return (
      <Jogador
        key={activeCampaign.id}
        isSpectator
        forcedCharacterId={characterId}
      />
    );
  }

  return user.role === "MESTRE"
    ? <Mestre key={activeCampaign.id} />
    : <Jogador key={activeCampaign.id} />;
}
