"use client";

import { useAuth } from "../../context/AuthContext";
import { useSearchParams } from "next/navigation";
import Mestre from "./mestre";
import Jogador from "./jogador";

export default function Mesa() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
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
