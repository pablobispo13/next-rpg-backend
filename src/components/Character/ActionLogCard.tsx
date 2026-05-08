import { Stack, Card, CardContent, Typography, Box } from "@mui/material";
import { ActionLog } from "../../types/types";
import HistoryIcon from "@mui/icons-material/History";
import { useState } from "react";
import { RollBreakdown } from "../Log/RollBreakdown";

type Props = {
  actionLog: ActionLog;
};

export function ActionLogCard({ actionLog }: Props) {
  const [hovering, setHovering] = useState(false);

  const color = "#6B7ADB";
  const isRoll =
    actionLog.type !== "TURN_START" &&
    actionLog.type !== "COMBAT_START" &&
    actionLog.type !== "COMBAT_END" &&
    actionLog.type !== "TURN_END";

  if (!isRoll) return null;

  // Calcula damageModifier e extrai impactRolls
  let damageRolls: number[] | undefined;
  let damageModifier = 0;

  if (actionLog.roll?.damage && actionLog.roll?.preset?.impactFormula) {
    // Se temos impactRolls (novo campo), usa diretamente
    const impactRollsData = (actionLog.roll as any).impactRolls;
    if (impactRollsData && impactRollsData.length > 0) {
      damageRolls = impactRollsData;
      // Calcula modificador: diferença entre damage total e soma dos dados brutos
      const impactDiceSum = impactRollsData.reduce((a: number, b: number) => a + b, 0);
      damageModifier = Math.max(0, actionLog.roll.damage - impactDiceSum);
    } else {
      // Fallback: estima baseado no modifier do ataque
      if (actionLog.roll.rolls && actionLog.roll.rolls.length > 0) {
        const attackDiceSum = actionLog.roll.rolls.reduce((a, b) => a + b, 0);
        const attackModifierOnly = actionLog.roll.modifier - attackDiceSum;
        damageModifier = Math.max(0, attackModifierOnly);
      }
    }
  }

  return (
    <Card
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      sx={{
        backgroundColor: "rgba(255, 255, 255, 0.03)",
        border: `2px solid ${hovering ? color : "rgba(255, 255, 255, 0.1)"}`,
        borderRadius: 2,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        boxShadow: hovering ? `0 8px 24px ${color}40` : "0 2px 8px rgba(0, 0, 0, 0.3)",
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Stack direction="row" alignItems="flex-start" spacing={1.5} mb={1.5}>
          <Box
            sx={{
              fontSize: "1.5rem",
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: `${color}20`,
              borderRadius: 1,
              border: `1px solid ${color}40`,
              flexShrink: 0,
            }}
          >
            <HistoryIcon fontSize="small" />
          </Box>

          <Stack flex={1} minWidth={0}>
            <Typography fontWeight="bold" variant="subtitle2">
              {actionLog.message}
            </Typography>
          </Stack>
        </Stack>

        {/* RollBreakdown se houver roll */}
        {actionLog.roll && (
          <Box sx={{ backgroundColor: "#1a1a2e20", p: 1.5, borderRadius: 1.5, mt: 1.5 }}>
            <RollBreakdown
              roll={actionLog.roll}
              succeeded={actionLog.roll.sucess ?? undefined}
              showDamage={!!actionLog.roll.damage}
              damageRolls={damageRolls}
              damageModifier={damageModifier}
            />
          </Box>
        )}

        {/* Habilidade info */}
        {actionLog.roll?.preset && (
          <Stack spacing={1} sx={{ mt: 1.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                Habilidade:
              </Typography>
              <Typography variant="body2" fontWeight="500">
                {actionLog.roll.preset.name}
              </Typography>
            </Box>
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}
