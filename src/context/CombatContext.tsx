"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import api from "../lib/api";

export type CombatContextType = {
    combat: any | null;
    isMyTurn: boolean;
    actionUsed: boolean;
    selectedTargets: string[];
    pendingReactionRoll: any | null;
    myCharacterIds: any;
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
        reactionType: "DODGE" | "COUNTER_ATTACK" | "BLOCK" | "SKIP"
    ) => Promise<void>;
    refreshCombat: () => Promise<void>;
    nextRefreshIn: number;
    pauseAutoRefresh: () => void;
    resumeAutoRefresh: () => void;
    isAutoRefreshPaused: boolean;
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
    const [isAutoRefreshPaused, setIsAutoRefreshPaused] = useState(false);

    function pauseAutoRefresh() {
        setIsAutoRefreshPaused(true);
    }

    function resumeAutoRefresh() {
        setIsAutoRefreshPaused(false);
    }
    /* =========================
       LOAD COMBAT (estado real)
    ========================= */

    const pendingUpdateRef = useRef<NodeJS.Timeout | null>(null);
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    function extractPendingReaction(
        combatData: any,
        userId?: string
    ) {
        if (!combatData || !userId) return null;

        const ordered = [...(combatData.participants || [])].sort(
            (a: any, b: any) => a.turnOrder - b.turnOrder
        );

        const myCharacterIds = ordered
            .filter((p: any) => p.character.ownerId === userId)
            .map((p: any) => p.character.id);

        const pendingRoll = combatData.rollResults?.find((r: any) => {
            if (r.pendingReaction !== true) return false;
            if (r.reacted === true) return false;

            return r.targetIds?.some((tid: string) =>
                myCharacterIds.includes(tid)
            );
        });
        setMyCharacterIds(myCharacterIds)

        if (!pendingRoll) return null;

        const pendingTargets = pendingRoll.targetIds
            .map((tid: string) => {
                const p = ordered.find((o: any) => o.character.id === tid);
                return p?.character;
            })
            .filter(Boolean);

        const attackerParticipant = ordered.find(
            (o: any) => o.character.id === pendingRoll.characterId
        );

        return {
            ...pendingRoll,
            attackerName: attackerParticipant?.character?.name ?? "Alguém",
            pendingReactionTargets: pendingTargets,
        };
    }

    useEffect(() => {
        if (!combat || !user?.id) {
            setPendingReactionRoll(null);
            return;
        }

        const nextPending = extractPendingReaction(combat, user.id);

        setPendingReactionRoll((prev: any) => {
            if (prev?.id === nextPending?.id) return prev;
            return nextPending;
        });
    }, [combat, user?.id]);

    const REFRESH_INTERVAL = 10000;

    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const countdownRef = useRef<NodeJS.Timeout | null>(null);

    const [nextRefreshIn, setNextRefreshIn] = useState(REFRESH_INTERVAL / 1000);

    const refreshCombat = useCallback(async () => {
        if (!combatId) return;

        await loadCombat(combatId);
        setNextRefreshIn(REFRESH_INTERVAL / 1000);
    }, [combatId]);

    useEffect(() => {
        if (isAutoRefreshPaused) {
            setNextRefreshIn(0);
        }
    }, [isAutoRefreshPaused]);

    useEffect(() => {
        if (!combatId) return;
        if (isAutoRefreshPaused) return;

        refreshCombat(); // carrega imediatamente

        intervalRef.current = setInterval(() => {
            refreshCombat();
        }, REFRESH_INTERVAL);

        countdownRef.current = setInterval(() => {
            setNextRefreshIn(prev => {
                if (prev <= 1) return REFRESH_INTERVAL / 1000;
                return prev - 1;
            });
        }, 1000);

        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current);
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [combatId, refreshCombat, isAutoRefreshPaused]);

    async function loadCombat(id = combatId) {
        if (!id) return;

        try {
            const res = await api.get(`/combat/${id}`);
            const data = res.data;
            setCombat(data);
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
    useEffect(() => {
        if (!activeTurn) {
            optimisticActionRef.current = false;
            setActionUsed(false);
            setSelectedTargets([]);
        }
    }, [activeTurn?.id]);

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
        if (!isMyTurn) return;
        if (actionUsed) return;
        if (pendingReactionRoll) return;

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
        if (!combat) return;
        if (!isMyTurn) return;
        if (actionUsed || optimisticActionRef.current) return;
        if (pendingReactionRoll) return;

        try {
            optimisticActionRef.current = true;
            setActionUsed(true); // 🔒 trava UI imediatamente

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
            optimisticActionRef.current = false;
            setActionUsed(false);
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
    const activeTurnIdRef = useRef<string | null>(null);

    useEffect(() => {
        if (activeTurn?.id) {
            activeTurnIdRef.current = activeTurn.id;
        }
    }, [activeTurn?.id]);

    async function endTurn() {
        if (!combat || !isMyTurn) return;
        if (pendingReactionRoll) return;

        try {
            await api.post("/combat/control", {
                action: "endTurn",
                combatId: combat.id,
                turnId: activeTurnIdRef.current,
            });

            optimisticActionRef.current = false;
            setActionUsed(false);
            setSelectedTargets([]);
            await loadCombat();
        } catch (err) {
            console.error("Erro ao finalizar turno", err);
        }
    }

    async function resolveReaction(
        rollId: string,
        reactionType: "DODGE" | "COUNTER_ATTACK" | "BLOCK" | "SKIP"
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

            await loadCombat(); // 🔥 backend decide tudo
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
                myCharacterIds,
                loadCombat,
                selectTarget,
                clearTargets,
                useMainAction,
                startCombat,
                startTurn,
                endTurn,
                resolveReaction,
                refreshCombat,
                nextRefreshIn,
                pauseAutoRefresh,
                resumeAutoRefresh,
                isAutoRefreshPaused,
            }}
        >
            {children}
        </CombatContext.Provider>
    );
}

export function useCombat() {
    return useContext(CombatContext);
}
