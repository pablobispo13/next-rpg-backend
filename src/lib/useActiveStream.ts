import { useCallback, useEffect, useState } from "react";
import api from "./api";
import { getPusherClient } from "./pusherClient";

export function useActiveStream(): string | null {
    const [streamUrl, setStreamUrl] = useState<string | null>(null);

    const fetchStream = useCallback(async () => {
        try {
            const res = await api.get("/stream", { silent: true });
            setStreamUrl(res.data?.streamUrl ?? null);
        } catch {
            // silently ignore
        }
    }, []);

    // Pusher: atualização imediata quando o mestre ativa/remove a stream
    useEffect(() => {
        const pusher = getPusherClient();
        if (!pusher) return;

        const channel = pusher.subscribe("stream");
        channel.bind("updated", fetchStream);

        return () => {
            channel.unbind("updated", fetchStream);
        };
    }, [fetchStream]);

    // Fallback polling a cada 20s (cobre casos sem Pusher ou reconexão)
    useEffect(() => {
        fetchStream();
        const id = setInterval(fetchStream, 20000);
        return () => clearInterval(id);
    }, [fetchStream]);

    return streamUrl;
}
