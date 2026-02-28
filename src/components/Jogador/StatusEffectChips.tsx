import { Stack } from "@mui/material";
import { CharacterStatusEffect } from "../../types/types";


type Props = {
    effects: CharacterStatusEffect[];
};

export function StatusEffectChips({ effects }: Props) {
    if (!effects.length) return null;
    return (
        <div style={{ display: "flex", gap: 8, flexDirection: "column" }}>
            {effects.map(effect => (<Stack key={effect.id}>
                {effect.type === "HEAL_OVER_TIME" ? "Cura por rodada" : "Dano por rodada"}
                {effect.remainingTurns !== undefined && (
                    <>  (Rodadas para terminar:{effect.remainingTurns})</>
                )}
            </Stack>
            ))}
        </div>
    );
}
