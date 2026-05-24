/**
 * Em multi-mesa, um personagem é "NPC" se o dono dele é o mestre da mesa.
 * Substitui a heurística antiga `owner.role === "MESTRE"`, que pifa quando um
 * usuário é mestre em uma mesa e jogador em outra.
 */
export function isNpc(
  character: { ownerId?: string | null } | null | undefined,
  masterId: string | null | undefined
): boolean {
  if (!character?.ownerId || !masterId) return false;
  return character.ownerId === masterId;
}
