"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import api from "../lib/api";
import { toast } from "react-toastify";
import { AxiosError } from "axios";
import { getPusherClient } from "../lib/pusherClient";

function apiErrorMessage(err: unknown, fallback = "Erro desconhecido"): string {
    const axiosErr = err as AxiosError<{ message?: string }>;
    return axiosErr?.response?.data?.message ?? fallback;
}

export type CombatStats = {
    rounds: number;
    participants: { id: string; name: string; totalDamage: number; hits: number; misses: number; maxHit: number }[];
};

export type CombatContextType = {
    combat: any | null;
    isMyTurn: boolean;
    actionUsed: boolean;
    selectedTargets: string[];
    pendingReactionRoll: any | null;
    myCharacterIds: any;
    isLoading: boolean;
    combatStats: CombatStats | null;
    clearStats: () => void;
    loadCombat: (id?: string) => Promise<void>;
    selectTarget: (id: string, allowMultiple?: boolean) => void;
    clearTargets: () => void;
    useMainAction: (payload: {
        presetId: string;
        targetIds: string[];
        characterId: string;
    }) => Promise<void>;
    startCombat: (participantIds: string[]) => Promise<void>;
    startTurn: (combatId?: string) => Promise<void>;
    endTurn: () => Promise<void>;
    endCombat: () => Promise<void>;
    resolveReaction: (
        rollId: string,
        reactionType: "DODGE" | "COUNTER_ATTACK" | "BLOCK" | "SKIP"
    ) => Promise<void>;
    refreshCombat: () => Promise<void>;
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
    const optimisticActionRef = useRef(false);
    const [myCharacterIds, setMyCharacterIds] = useState<string[]>([]);
    const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
    const [pendingReactionRoll, setPendingReactionRoll] = useState<any | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [combatStats, setCombatStats] = useState<CombatStats | null>(null);

    function clearStats() {
        setCombatStats(null);
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const activeTurnIdRef = useRef<string | null>(null);

    function extractPendingReaction(combatData: any, userId?: string) {
        if (!combatData || !userId) return null;

        const ordered = [...(combatData.participants || [])].sort(
            (a: any, b: any) => a.turnOrder - b.turnOrder
        );

        const myCharIds = ordered
            .filter((p: any) => p.character.ownerId === userId)
            .map((p: any) => p.character.id);

        const pendingRoll = combatData.rollResults?.find((r: any) => {
            if (r.reacted === true) return false;
            if (!r.pendingReactionTargets || r.pendingReactionTargets.length === 0) return false;
            return r.pendingReactionTargets.some((rt: any) =>
                myCharIds.includes(rt.targetId) && rt.status === "PENDING"
            );
        });

        setMyCharacterIds(myCharIds);

        if (!pendingRoll) return null;

        const nextPendingTarget = pendingRoll.pendingReactionTargets.find((rt: any) =>
            myCharIds.includes(rt.targetId) && rt.status === "PENDING"
        );

        if (!nextPendingTarget) return null;

        const targetCharacter = ordered.find(
            (p: any) => p.character.id === nextPendingTarget.targetId
        )?.character;

        const attackerParticipant = ordered.find(
            (o: any) => o.character.id === pendingRoll.characterId
        );

        return {
            ...pendingRoll,
            attackerName: attackerParticipant?.character?.name ?? "Alguém",
            currentReactionTarget: targetCharacter,
            totalTargets: pendingRoll.pendingReactionTargets.length,
            currentTargetIndex:
                pendingRoll.pendingReactionTargets.findIndex(
                    (rt: any) => rt.targetId === nextPendingTarget.targetId
                ) + 1,
        };
    }

    useEffect(() => {
        if (!combat || !user?.id) {
            setPendingReactionRoll(null);
            return;
        }

        const nextPending = extractPendingReaction(combat, user.id);

        setPendingReactionRoll((prev: any) => {
            if (!nextPending) return null;
            if (prev?.id !== nextPending?.id) return nextPending;
            if (prev?.currentReactionTarget?.id !== nextPending?.currentReactionTarget?.id)
                return nextPending;
            return prev;
        });
    }, [combat, user?.id]);

    const refreshCombat = useCallback(async () => {
        if (!combatId) return;
        await loadCombat(combatId);
    }, [combatId]);

    // Pusher: subscribe to real-time combat updates
    useEffect(() => {
        if (!combatId) return;
        const pusher = getPusherClient();
        if (!pusher) return;

        const channel = pusher.subscribe(`combat-${combatId}`);
        channel.bind("updated", () => {
            loadCombat(combatId);
        });

        return () => {
            channel.unbind_all();
            pusher.unsubscribe(`combat-${combatId}`);
        };
    }, [combatId]);

    useEffect(() => {
        if (combatId) loadCombat(combatId);
    }, [combatId]);

    async function loadCombat(id = combatId) {
        if (!id) return;
        try {
            const res = await api.get(`/combat/${id}`, { silent: true });
            const data = res.data;
            setCombat(data);

            // Eagerly sync activeTurnIdRef so it's never stale after a refresh
            const loadedOrdered = [...(data.participants || [])].sort(
                (a: any, b: any) => a.turnOrder - b.turnOrder
            );
            const loadedActiveChar = loadedOrdered[data.currentTurnIndex]?.character;
            if (loadedActiveChar) {
                const loadedActiveTurn = (data.turns as any[])?.find(
                    (t: any) => t.characterId === loadedActiveChar.id && !t.endedAt
                );
                activeTurnIdRef.current = loadedActiveTurn?.id ?? null;
            } else {
                activeTurnIdRef.current = null;
            }
        } catch (err: any) {
            if (err?.response?.status === 404) {
                // Combat was ended — mark inactive so players are redirected
                setCombat((prev: any) => (prev ? { ...prev, active: false } : { active: false }));
            }
            console.error("Erro ao carregar combate", err);
        }
    }

    useEffect(() => {
        if (!authLoading) loadCombat();
    }, [authLoading]);

    /* Derived state */
    const ordered = combat?.participants
        ? [...combat.participants].sort((a, b) => a.turnOrder - b.turnOrder)
        : [];

    const activeParticipant = ordered[combat?.currentTurnIndex];
    const activeCharacter = activeParticipant?.character;

    const activeTurn = combat?.turns?.find(
        (t: any) => t.characterId === activeCharacter?.id && !t.endedAt
    );

    useEffect(() => {
        if (!activeTurn) {
            optimisticActionRef.current = false;
            setActionUsed(false);
            setSelectedTargets([]);
        }
    }, [activeTurn?.id]);

    const controlledCharacterIds =
        ordered
            .filter((p: any) => p.character.ownerId === user?.id || isMaster)
            .map((p: any) => p.character.id) || [];

    const isMyTurn =
        Boolean(activeCharacter) && controlledCharacterIds.includes(activeCharacter.id);

    /* UI actions */
    function selectTarget(id: string, allowMultiple = false) {
        if (!isMyTurn) return;
        if (actionUsed) return;
        if (pendingReactionRoll) return;
        setSelectedTargets((prev) => {
            if (prev.includes(id)) return prev.filter((t) => t !== id);
            if (!allowMultiple) return [id];
            return [...prev, id];
        });
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
        if (!combat || !isMyTurn) return;
        if (actionUsed || optimisticActionRef.current) return;
        if (pendingReactionRoll) return;

        const turnId = activeTurnIdRef.current ?? activeTurn?.id;
        if (!turnId) {
            toast.error("ID do turno não disponível. Recarregue e tente novamente.");
            return;
        }

        try {
            optimisticActionRef.current = true;
            setActionUsed(true);
            setIsLoading(true);

            await api.post("/roll", {
                actionPresetId: presetId,
                combatId: combat.id,
                turnId,
                targetIds,
                characterId,
            });

            setSelectedTargets([]);
            await loadCombat();
        } catch (err) {
            optimisticActionRef.current = false;
            setActionUsed(false);
            toast.error(apiErrorMessage(err, "Erro ao usar ação"));
        } finally {
            setIsLoading(false);
        }
    }

    async function startCombat(participantIds: string[]) {
        try {
            setIsLoading(true);
            const res = await api.post("/combat/control", {
                action: "startCombat",
                participantIds,
            });
            await startTurn(res.data.combat.id);
        } catch (err) {
            toast.error(apiErrorMessage(err, "Erro ao iniciar combate"));
        } finally {
            setIsLoading(false);
        }
    }

    async function startTurn(combatIdParam?: string) {
        const id = combatIdParam || combat?.id;
        if (!id) return;
        try {
            setIsLoading(true);
            await api.post("/combat/control", { action: "startTurn", combatId: id });
            setSelectedTargets([]);
            await loadCombat(id);
        } catch (err) {
            toast.error(apiErrorMessage(err, "Erro ao iniciar turno"));
        } finally {
            setIsLoading(false);
        }
    }

    async function endTurn() {
        if (!combat || !isMyTurn) return;
        if (pendingReactionRoll) return;

        const turnId = activeTurnIdRef.current ?? activeTurn?.id;
        if (!turnId) {
            toast.error("ID do turno não disponível. Recarregue e tente novamente.");
            return;
        }

        try {
            setIsLoading(true);
            await api.post("/combat/control", {
                action: "endTurn",
                combatId: combat.id,
                turnId,
            });

            optimisticActionRef.current = false;
            setActionUsed(false);
            setSelectedTargets([]);
            activeTurnIdRef.current = null;

            // Auto-start the next turn so the new turnId is available immediately
            try {
                await api.post("/combat/control", { action: "startTurn", combatId: combat.id });
            } catch {
                // startTurn may fail if the turn already exists (idempotency) — ignore
            }

            await loadCombat();
        } catch (err) {
            toast.error(apiErrorMessage(err, "Erro ao finalizar turno"));
        } finally {
            setIsLoading(false);
        }
    }

    async function endCombat() {
        if (!combat) return;
        try {
            setIsLoading(true);
            const res = await api.post("/combat/control", {
                action: "endCombat",
                combatId: combat.id,
            });
            if (res.data?.stats) {
                setCombatStats(res.data.stats);
            }
        } catch (err) {
            toast.error(apiErrorMessage(err, "Erro ao encerrar combate"));
        } finally {
            setIsLoading(false);
        }
    }

    async function resolveReaction(
        rollId: string,
        reactionType: "DODGE" | "COUNTER_ATTACK" | "BLOCK" | "SKIP"
    ) {
        if (!combat || !pendingReactionRoll) return;

        const targetId = pendingReactionRoll.currentReactionTarget?.id;
        const reactionTurnId = pendingReactionRoll.turnId;
        const reactionCombatId = pendingReactionRoll.combatId;

        if (!targetId) {
            toast.error("Alvo da reação não disponível");
            return;
        }
        if (!reactionCombatId) {
            toast.error("combatId não disponível na reação");
            return;
        }

        try {
            setIsLoading(true);

            await api.post("/combat/react", {
                rollId,
                reactionType,
                targetId,
                turnId: reactionTurnId ?? undefined,
            });

            await loadCombat();
        } catch (err) {
            toast.error(apiErrorMessage(err, "Erro ao reagir"));
        } finally {
            setIsLoading(false);
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
                myCharacterIds,
                isLoading,
                combatStats,
                clearStats,
                loadCombat,
                selectTarget,
                clearTargets,
                useMainAction,
                startCombat,
                startTurn,
                endTurn,
                endCombat,
                resolveReaction,
                refreshCombat,
            }}
        >
            {children}
        </CombatContext.Provider>
    );
}

export function useCombat() {
    return useContext(CombatContext);
}
