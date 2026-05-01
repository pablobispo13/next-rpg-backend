export function calculateMaxLife(strength: number, vigor: number): number {
  return 25 + (strength * 2) + (vigor * 3);
}

export function calculateDefense(agility: number, vigor: number): number {
  return 3 + (agility + vigor);
}

export function calculateCounterAttackDamage(
  baseDamage: number,
  strength: number,
  modifier: number = 0
): number {
  return baseDamage + strength + modifier;
}
