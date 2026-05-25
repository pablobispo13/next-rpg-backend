import api from "./api";

export type Archetype = "PLAYER" | "ENEMY" | "BOSS" | "MINION" | "NPC";

export const ARCHETYPE_LABELS: Record<Archetype, string> = {
  PLAYER: "Personagem Jogador",
  ENEMY: "Inimigo Comum",
  BOSS: "Chefão",
  MINION: "Lacaio",
  NPC: "NPC pacífico",
};

/**
 * Cria um personagem completo (com presets de teste de atributo + reações)
 * em uma única chamada atômica ao backend.
 */
export async function createCharacterTemplate(
  name = "Novo Personagem",
  archetype: Archetype = "PLAYER",
) {
  const { data } = await api.post("/characters/template", { name, archetype });
  return data;
}
