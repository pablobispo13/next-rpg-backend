"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import api from "../lib/api";
import { Character } from "@prisma/client";

export type CombatContextType = {
    combat: any | null;
    isMyTurn: boolean;
    actionUsed: boolean;
    selectedTargets: string[];
    pendingReactionRoll: any | null;

    loadCombat: (id?: string) => Promise<void>;
    selectTarget: (id: string) => void;
    clearTargets: () => void;
    useMainAction: (payload: {
        presetId: string;
        targetIds: string[];
        characterId: string;
    }) => Promise<void>;
    startCombat: (participantIds: string[]) => Promise<void>;
    startTurn: (combatId?: string) => Promise<void>;
    endTurn: () => Promise<void>;
    resolveReaction: (
        rollId: string,
        reactionType: "DODGE" | "COUNTER_ATTACK" | "BLOCK"
    ) => Promise<void>;
};

const CombatContext = createContext<CombatContextType>({} as any);

export function CombatProvider({
    combatId,
    children,
}: {
    combatId?: string;
    children: React.ReactNode;
}) {
    const { user, loading: authLoading } = useAuth();
    const isMaster = user?.role === "MESTRE";

    const [combat, setCombat] = useState<any | null>(null);
    const [actionUsed, setActionUsed] = useState(false);
    const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
    const [pendingReactionRoll, setPendingReactionRoll] = useState<any | null>(null);

    /* =========================
       LOAD COMBAT (estado real)
    ========================= */

    const pendingUpdateRef = useRef<NodeJS.Timeout | null>(null);
    const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const fetchCharacters = useCallback(async () => {
        if (!token) return;
        try {
            const res = await api.get("/characters", {
                headers: { Authorization: `Bearer ${token}` },
            });
            // setCharacters(res.data.characters);
            console.log(res.data.characters)
            // if (res.data.roomToken) setRoomToken(res.data.roomToken);
        } catch (err) {
            console.error(err);
        }
    }, [token]);

    useEffect(() => {
        if (!token) return;

        fetchCharacters();
        const es = new EventSource("/api/stream");

        es.onmessage = (event) => {
            const data = JSON.parse(event.data) as {
                characters: Character[];
                roomToken: string;
            };

            if (pendingUpdateRef.current) clearTimeout(pendingUpdateRef.current);

            pendingUpdateRef.current = setTimeout(() => {
                // setRoomToken(data.roomToken);
                // sempre use os dados do servidor, evita o "pulo" do personagem
                // setCharacters(data.characters);
                console.log(data.characters)
            }, 100);
        };

        es.onerror = () => {
            es.close();
            setTimeout(() => {
                if (typeof window !== "undefined") {
                    new EventSource("/api/stream");
                }
            }, 5000);
        };

        return () => {
            es.close();
            if (pendingUpdateRef.current) clearTimeout(pendingUpdateRef.current);
        };
    }, [token, fetchCharacters]);



    async function loadCombat(id = combatId) {
        if (!id) return;

        try {
            const res = await api.get(`/combat/${id}`);
            const data = res.data;
            setCombat(data);

            const ordered = [...(data.participants || [])].sort(
                (a: any, b: any) => a.turnOrder - b.turnOrder
            );

            const activeParticipant = ordered[data.currentTurnIndex];
            const activeCharacter = activeParticipant?.character;

            const activeTurn = data.turns?.find(
                (t: any) =>
                    t.characterId === activeCharacter?.id &&
                    !t.endedAt
            );

            /* ✅ actionUsed SOMENTE para quem está no turno */
            if (activeTurn?.characterId === activeCharacter?.id) {
                setActionUsed(Boolean(activeTurn?.hasUsedMainAction));
            } else {
                setActionUsed(false);
            }

            /* =========================
               Reação pendente (alvos)
            ========================= */

            const myCharacterIds = ordered
                .filter((p: any) => p.character.ownerId === user?.id)
                .map((p: any) => p.character.id);

            const pendingRoll = data.rollResults?.find((r: any) => {
                if (!r.pendingReaction || r.reacted) return false;
                return r.targetIds.some((tid: string) =>
                    myCharacterIds.includes(tid)
                );
            });

            if (pendingRoll) {
                const pendingTargets = pendingRoll.targetIds
                    .map((tid: string) => {
                        const p = ordered.find(
                            (o: any) => o.character.id === tid
                        );
                        return p?.character;
                    })
                    .filter(Boolean);

                setPendingReactionRoll({
                    ...pendingRoll,
                    pendingReactionTargets: pendingTargets,
                });
            } else {
                setPendingReactionRoll(null);
            }
        } catch (err) {
            console.error("Erro ao carregar combate", err);
        }
    }

    useEffect(() => {
        if (!authLoading) loadCombat();
    }, [authLoading]);

    /* =========================
       DERIVED STATE
    ========================= */

    const ordered = combat?.participants
        ? [...combat.participants].sort(
            (a, b) => a.turnOrder - b.turnOrder
        )
        : [];

    const activeParticipant = ordered[combat?.currentTurnIndex];
    const activeCharacter = activeParticipant?.character;

    const activeTurn = combat?.turns?.find(
        (t: any) =>
            t.characterId === activeCharacter?.id &&
            !t.endedAt
    );

    const controlledCharacterIds =
        ordered
            .filter(
                (p: any) =>
                    p.character.ownerId === user?.id || isMaster
            )
            .map((p: any) => p.character.id) || [];

    /* ✅ isMyTurn NÃO depende de reação */
    const isMyTurn =
        Boolean(activeCharacter) &&
        controlledCharacterIds.includes(activeCharacter.id);

    /* =========================
       UI ACTIONS
    ========================= */

    function selectTarget(id: string) {
        if (!isMyTurn || actionUsed || pendingReactionRoll) return;

        setSelectedTargets((prev) =>
            prev.includes(id)
                ? prev.filter((t) => t !== id)
                : [...prev, id]
        );
    }

    function clearTargets() {
        setSelectedTargets([]);
    }

    async function useMainAction({
        presetId,
        targetIds,
        characterId,
    }: {
        presetId: string;
        targetIds: string[];
        characterId: string;
    }) {
        if (!combat || actionUsed || pendingReactionRoll) return;

        try {
            await api.post("/roll", {
                actionPresetId: presetId,
                combatId: combat.id,
                turnId: activeTurn?.id ?? null,
                targetIds,
                characterId,
            });

            setSelectedTargets([]);
            await loadCombat();
        } catch (err) {
            console.error("Erro ao usar ação", err);
        }
    }

    async function startCombat(participantIds: string[]) {
        try {
            const res = await api.post("/combat/control", {
                action: "startCombat",
                participantIds,
            });

            await startTurn(res.data.combat.id);
        } catch (err) {
            console.error("Erro ao iniciar combate", err);
        }
    }

    async function startTurn(combatIdParam?: string) {
        const id = combatIdParam || combat?.id;
        if (!id) return;

        try {
            await api.post("/combat/control", {
                action: "startTurn",
                combatId: id,
            });

            setSelectedTargets([]);
            await loadCombat(id);
        } catch (err) {
            console.error("Erro ao iniciar turno", err);
        }
    }

    async function endTurn() {
        if (!combat || !isMyTurn || pendingReactionRoll) return;

        if (!actionUsed) {
            alert("Use uma ação principal antes de passar o turno.");
            return;
        }

        try {
            await api.post("/combat/control", {
                action: "endTurn",
                combatId: combat.id,
                turnId: activeTurn?.id,
            });

            await loadCombat();
        } catch (err) {
            console.error("Erro ao finalizar turno", err);
        }
    }

    async function resolveReaction(
        rollId: string,
        reactionType: "DODGE" | "COUNTER_ATTACK" | "BLOCK"
    ) {
        if (!combat || !pendingReactionRoll) return;

        try {
            const targets = pendingReactionRoll.pendingReactionTargets;
            const reactingCharacter =
                targets.find((t: any) => t.ownerId === user?.id) ??
                targets[0];

            await api.post("/combat/react", {
                rollId,
                reactionType,
                characterId: reactingCharacter.id,
                turnId: pendingReactionRoll.turnId,
            });

            setPendingReactionRoll(null);
            await loadCombat();
        } catch (err) {
            console.error("Erro ao reagir", err);
        }
    }

    return (
        <CombatContext.Provider
            value={{
                combat,
                isMyTurn,
                actionUsed,
                selectedTargets,
                pendingReactionRoll,
                loadCombat,
                selectTarget,
                clearTargets,
                useMainAction,
                startCombat,
                startTurn,
                endTurn,
                resolveReaction,
            }}
        >
            {children}
        </CombatContext.Provider>
    );
}

export function useCombat() {
    return useContext(CombatContext);
}
