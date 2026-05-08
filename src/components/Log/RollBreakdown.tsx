"use client";

import { Box, Stack, Typography, Chip, Divider } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";

interface RollBreakdownProps {
  roll: any;
  succeeded?: boolean;
  targetDefense?: number;
  showDamage?: boolean;
  damageRolls?: number[];
  damageModifier?: number;
}

export function RollBreakdown({
  roll,
  succeeded,
  targetDefense,
  showDamage = false,
  damageRolls,
  damageModifier = 0,
}: RollBreakdownProps) {
  const diceSum = roll.rolls.reduce((a: number, b: number) => a + b, 0);
  const successColor = succeeded ? "#4ade80" : "#f87171";
  const successIcon = succeeded ? <CheckCircleIcon /> : <CancelIcon />;
  const attackModifier = roll.modifier - diceSum;

  return (
    <Stack spacing={2}>
      {/* Ataque/Teste */}
      <Box>
        <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
          <Typography variant="caption" color="text.secondary" fontWeight="600">
            TESTE/ATAQUE
          </Typography>
          {succeeded !== undefined && (
            <Chip
              icon={successIcon}
              label={succeeded ? "Acertou" : "Falhou"}
              size="small"
              sx={{
                backgroundColor: `${successColor}20`,
                color: successColor,
                fontWeight: "bold",
              }}
            />
          )}
        </Stack>

        <Box sx={{ fontFamily: "monospace", fontSize: 12, backgroundColor: "#1a1a2e", p: 1.5, borderRadius: 1 }}>
          <Stack spacing={0.8}>
            <Typography sx={{ fontFamily: "monospace" }}>
              <span style={{ color: "#fbbf24" }}>
                {roll.diceRolled} ({roll.rolls.join(", ")})
              </span>
              {" = "}
              <span style={{ color: "#60a5fa" }}>{diceSum}</span>
            </Typography>

            <Stack spacing={0.4} sx={{ pl: 1.5, borderLeft: "2px solid #374151" }}>
              <Typography sx={{ fontFamily: "monospace", fontSize: 11 }}>
                ├─ Dado:{" "}
                <span style={{ color: "#4ade80" }}>{diceSum}</span>
              </Typography>

              {attackModifier > 0 && (
                <Typography sx={{ fontFamily: "monospace", fontSize: 11 }}>
                  ├─ Modificador:{" "}
                  <span style={{ color: "#a78bfa" }}>+{attackModifier}</span>
                </Typography>
              )}

              <Typography sx={{ fontFamily: "monospace", fontSize: 11, fontWeight: "bold" }}>
                └─ TOTAL:{" "}
                <span style={{ color: "#fbbf24", fontSize: 13 }}>
                  {roll.total}
                  {roll.critical && (
                    <span style={{ color: "#f97316", marginLeft: 4 }}>⚡ CRÍTICO</span>
                  )}
                </span>
              </Typography>
            </Stack>
          </Stack>
        </Box>

        {targetDefense !== undefined && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }} display="block">
            vs Defesa: <span style={{ color: "#60a5fa" }}>{targetDefense}</span>
          </Typography>
        )}
      </Box>

      {/* Dano (se houver e > 0) */}
      {showDamage && roll.damage && roll.damage > 0 && roll.preset?.impactFormula && (
        <>
          <Divider />
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight="600" mb={1} display="block">
              DANO
            </Typography>

            <Box sx={{ fontFamily: "monospace", fontSize: 12, backgroundColor: "#1a1a2e", p: 1.5, borderRadius: 1 }}>
              <Stack spacing={0.8}>
                <Typography sx={{ fontFamily: "monospace" }}>
                  <span style={{ color: "#fbbf24" }}>
                    {roll.preset.impactFormula}
                  </span>
                  {damageRolls && (
                    <>
                      {" ("}<span style={{ color: "#60a5fa" }}>{damageRolls.join(", ")}</span>{")"} ={" "}
                      <span style={{ color: "#60a5fa" }}>{damageRolls.reduce((a: number, b: number) => a + b, 0)}</span>
                    </>
                  )}
                </Typography>

                <Stack spacing={0.4} sx={{ pl: 1.5, borderLeft: "2px solid #374151" }}>
                  {damageRolls && (
                    <Typography sx={{ fontFamily: "monospace", fontSize: 11 }}>
                      ├─ Dado:{" "}
                      <span style={{ color: "#4ade80" }}>
                        {damageRolls.reduce((a: number, b: number) => a + b, 0)}
                      </span>
                    </Typography>
                  )}

                  {damageModifier > 0 && (
                    <Typography sx={{ fontFamily: "monospace", fontSize: 11 }}>
                      ├─ Modificador:{" "}
                      <span style={{ color: "#a78bfa" }}>+{damageModifier}</span>
                    </Typography>
                  )}

                  <Typography sx={{ fontFamily: "monospace", fontSize: 11, fontWeight: "bold" }}>
                    └─ TOTAL DANO:{" "}
                    <span style={{ color: "#f87171", fontSize: 13 }}>
                      {roll.damage}
                      {roll.critical && roll.preset?.critMultiplier && (
                        <span style={{ color: "#f97316", marginLeft: 4 }}>x{roll.preset.critMultiplier}</span>
                      )}
                    </span>
                  </Typography>
                </Stack>
              </Stack>
            </Box>
          </Box>
        </>
      )}

      {/* Cura (se houver) */}
      {showDamage && (roll as any).healing && (roll as any).healing > 0 && (
        <>
          <Divider />
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight="600" mb={1} display="block">
              CURA
            </Typography>

            <Box sx={{ fontFamily: "monospace", fontSize: 12, backgroundColor: "#1a1a2e", p: 1.5, borderRadius: 1 }}>
              <Stack spacing={0.4} sx={{ pl: 1.5, borderLeft: "2px solid #374151" }}>
                <Typography sx={{ fontFamily: "monospace", fontSize: 11, fontWeight: "bold" }}>
                  └─ TOTAL CURA:{" "}
                  <span style={{ color: "#4ade80", fontSize: 13 }}>+{(roll as any).healing}</span>
                </Typography>
              </Stack>
            </Box>
          </Box>
        </>
      )}
    </Stack>
  );
}
