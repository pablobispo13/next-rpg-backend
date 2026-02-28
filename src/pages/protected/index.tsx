"use client";

import { useAuth } from "../../context/AuthContext";
import { useSearchParams } from "next/navigation";
import Mestre from "./mestre";
import Jogador from "./jogador";
import { handleLogout } from "../../lib/api";
import { useEffect, useState } from "react";

export default function Mesa() {
  const { user } = useAuth();
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
  }, [user, tentativas, handleLogout]);

  if (!user) {
    return <>Carregando...</>;
  }
  
  const view = searchParams.get("view");
  const characterId = searchParams.get("characterId");
  if (user.role === "MESTRE" && view === "jogador") {
    return (
      <Jogador
        isSpectator
        forcedCharacterId={characterId}
      />
    );
  }

  return user.role === "MESTRE"
    ? <Mestre />
    : <Jogador />;
}
