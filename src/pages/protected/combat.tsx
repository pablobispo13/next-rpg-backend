"use client";

import { useSearchParams } from "next/navigation";
import CombatScreen from "../../components/Combat/CombatScreen";

export default function CombatPage() {
    const params = useSearchParams();
    const combatId = params.get("combatId");

    if (!combatId) return <>Combate não encontrado</>;

    return <CombatScreen combatId={combatId} />;
}
