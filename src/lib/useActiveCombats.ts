import { useCallback, useEffect, useState } from "react";
import api from "../lib/api";
import { Combat } from "@prisma/client";
import { getPusherClient } from "../lib/pusherClient";

export function useActiveCombats() {
    const [combats, setCombats] = useState<Combat[]>([]);
    const [loading, setLoading] = useState(true);

    const loadCombats = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get("/combat/active", { silent: true });
            setCombats(res.data);
        } catch {
            // silently ignore
        } finally {
            setLoading(false);
        }
    }, []);

    // Pusher: atualiza imediatamente quando combate é criado ou encerrado
    useEffect(() => {
        const pusher = getPusherClient();
        if (!pusher) return;

        const channel = pusher.subscribe("combats");
        channel.bind("updated", loadCombats);

        return () => {
            channel.unbind("updated", loadCombats);
        };
    }, [loadCombats]);

    // Carga inicial + polling de fallback a cada 30s
    useEffect(() => {
        loadCombats();
        const id = setInterval(loadCombats, 30000);
        return () => clearInterval(id);
    }, [loadCombats]);

    return { combats, loading, reload: loadCombats };
}
