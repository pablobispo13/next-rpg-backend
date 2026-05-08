export type DiceRollResult = {
  rolls: number[];
  total: number;
  modifier: number;
};

const MAX_DICE_PER_GROUP = 1000;
const MAX_SIDES = 10000;
const MAX_TOTAL_DICE = 100;

/**
 * Rolls a dice expression supporting multiple groups: "1d8+2+1d8-3", "2d6", "1d20+5".
 * Returns rolls as signed contributions (negative for subtracted groups),
 * so sum(rolls) + modifier === total always holds.
 */
export function rollDice(expression: string): DiceRollResult {
  const clean = expression.trim().toLowerCase().replace(/\s+/g, "");
  if (!clean) throw new Error('Expressão de dado vazia');

  // Split on + or - boundaries, keeping the sign with each token
  const tokens = clean.split(/(?=[+-])/);

  const rolls: number[] = [];
  let modifier = 0;
  let totalDiceCount = 0;

  for (const rawToken of tokens) {
    if (!rawToken) continue;
    const sign = rawToken.startsWith("-") ? -1 : 1;
    const part = rawToken.replace(/^[+-]/, "");
    if (!part) throw new Error(`Token inválido na expressão: "${expression}"`);

    const diceMatch = part.match(/^(\d+)d(\d+)$/);
    if (diceMatch) {
      const count = Number(diceMatch[1]);
      const sides = Number(diceMatch[2]);

      if (count <= 0) throw new Error("Quantidade de dados deve ser maior que 0");
      if (sides <= 0) throw new Error("Número de lados deve ser maior que 0");
      if (count > MAX_DICE_PER_GROUP)
        throw new Error(`Máximo de dados por grupo: ${MAX_DICE_PER_GROUP}`);
      if (sides > MAX_SIDES)
        throw new Error(`Máximo de lados: ${MAX_SIDES}`);

      totalDiceCount += count;
      if (totalDiceCount > MAX_TOTAL_DICE)
        throw new Error(`Máximo de dados na expressão: ${MAX_TOTAL_DICE}`);

      for (let i = 0; i < count; i++) {
        const rawRoll = Math.floor(Math.random() * sides) + 1;
        rolls.push(sign * rawRoll);
      }
    } else {
      const num = Number(part);
      if (isNaN(num) || !isFinite(num))
        throw new Error(`Token inválido: "${part}"`);
      modifier += sign * num;
    }
  }

  if (rolls.length === 0 && modifier === 0) {
    throw new Error(`Expressão de dado inválida: "${expression}"`);
  }

  const total = rolls.reduce((s, r) => s + r, 0) + modifier;
  return { rolls, modifier, total };
}

/** Returns null if the formula is valid, or an error message string if invalid. */
export function validateDiceFormula(formula: string): string | null {
  if (!formula?.trim()) return "Fórmula não pode ser vazia";
  try {
    rollDice(formula);
    return null;
  } catch (e) {
    return (e as Error).message;
  }
}
