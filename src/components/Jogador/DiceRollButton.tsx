import { Button } from "@mui/material";

type Props = {
  label: string;
  attribute: string;
  value: number;
  onRoll: (result: number) => void;
};

export function DiceRollButton({
  label,
  attribute,
  value,
  onRoll,
}: Props) {
  function roll() {
    const dice = Math.floor(Math.random() * 20) + 1;
    const total = dice + value;

    onRoll(total);
  }

  return (
    <Button variant="contained" onClick={roll}>
      {label} ({attribute.toUpperCase()})
    </Button>
  );
}
