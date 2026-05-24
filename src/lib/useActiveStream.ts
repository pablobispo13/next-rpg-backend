import { useCallback, useEffect, useState } from "react";
import api from "./api";
import { getPusherClient } from "./pusherClient";
import { useCampaign } from "../context/CampaignContext";

export function useActiveStream(): string | null {
    const { activeCampaign } = useCampaign();
    const [streamUrl, setStreamUrl] = useState<string | null>(null);

    const fetchStream = useCallback(async () => {
        if (!activeCampaign) {
            setStreamUrl(null);
            return;
        }
        try {
            const res = await api.get("/stream", { silent: true });
            setStreamUrl(res.data?.streamUrl ?? null);
        } catch {
            // silently ignore
        }
    }, [activeCampaign]);

    // Pusher: canal por mesa
    useEffect(() => {
        if (!activeCampaign) return;
        const pusher = getPusherClient();
        if (!pusher) return;

        const channelName = `campaign-${activeCampaign.id}-stream`;
        const channel = pusher.subscribe(channelName);
        channel.bind("updated", fetchStream);

        return () => {
            channel.unbind("updated", fetchStream);
            pusher.unsubscribe(channelName);
        };
    }, [activeCampaign, fetchStream]);

    useEffect(() => {
        fetchStream();
    }, [fetchStream]);

    return streamUrl;
}
