export type DiceRollResult = {
  rolls: number[];
  total: number;
  modifier: number;
};

/**
 * Rola um dado no formato XdY+Z ou XdY-Z
 * Ex: "2d6", "3d8+2", "1d20-1"
 */
export function rollDice(expression: string): DiceRollResult {
  const match = expression.match(/^(\d+)d(\d+)([+-]\d+)?$/);
  if (!match) {
    throw new Error(`Expressão de dado inválida: "${expression}"`);
  }

  const [, countStr, sidesStr, modifierStr] = match;
  const count = Number(countStr);
  const sides = Number(sidesStr);
  const modifier = modifierStr ? Number(modifierStr) : 0;

  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    rolls.push(Math.floor(Math.random() * sides) + 1);
  }

  const total = rolls.reduce((a, b) => a + b, 0) + modifier;

  return {
    rolls,
    total,
    modifier,
  };
}
