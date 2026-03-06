export type DiceRollResult = {
  rolls: number[];
  total: number;
  modifier: number;
};

const MAX_DICE = 1000;
const MAX_SIDES = 10000;
export function rollDice(expression: string): DiceRollResult {
  const clean = expression.trim().toLowerCase();

  const match = clean.match(/^(\d+)d(\d+)([+-]\d+)?$/);

  if (!match) {
    throw new Error(`Expressão de dado inválida: "${expression}"`);
  }

  const count = Number(match[1]);
  const sides = Number(match[2]);
  const modifier = match[3] ? Number(match[3]) : 0;

  if (count <= 0) {
    throw new Error("Quantidade de dados deve ser maior que 0");
  }

  if (sides <= 0) {
    throw new Error("Número de lados deve ser maior que 0");
  }

  if (count > MAX_DICE) {
    throw new Error(`Máximo de dados permitido: ${MAX_DICE}`);
  }

  if (sides > MAX_SIDES) {
    throw new Error(`Máximo de lados permitido: ${MAX_SIDES}`);
  }

  const rolls: number[] = [];
  for (let i = 0; i < count; i++) {
    const roll = Math.floor(Math.random() * sides) + 1;
    rolls.push(roll);
  }

  const total = rolls.reduce((sum, r) => sum + r, 0) + modifier;

  return {
    rolls,
    total,
    modifier,
  };
}