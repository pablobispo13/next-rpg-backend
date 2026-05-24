import { useCallback, useEffect, useState } from "react";
import api from "../lib/api";
import { Combat } from "@prisma/client";
import { getPusherClient } from "../lib/pusherClient";
import { useCampaign } from "../context/CampaignContext";

export function useActiveCombats() {
    const { activeCampaign } = useCampaign();
    const [combats, setCombats] = useState<Combat[]>([]);
    const [loading, setLoading] = useState(true);

    const loadCombats = useCallback(async () => {
        if (!activeCampaign) {
            setCombats([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const res = await api.get("/combat/active", { silent: true });
            setCombats(res.data);
        } catch {
            // silently ignore
        } finally {
            setLoading(false);
        }
    }, [activeCampaign]);

    // Pusher: escuta canal específico da mesa ativa
    useEffect(() => {
        if (!activeCampaign) return;
        const pusher = getPusherClient();
        if (!pusher) return;

        const channelName = `campaign-${activeCampaign.id}-combats`;
        const channel = pusher.subscribe(channelName);
        channel.bind("updated", loadCombats);

        return () => {
            channel.unbind("updated", loadCombats);
            pusher.unsubscribe(channelName);
        };
    }, [activeCampaign, loadCombats]);

    useEffect(() => {
        loadCombats();
    }, [loadCombats]);

    return { combats, loading, reload: loadCombats };
}
