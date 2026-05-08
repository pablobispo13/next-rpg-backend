import { useEffect, useState } from "react";
import api from "./api";

export function useActiveStream(pollMs = 20000): string | null {
    const [streamUrl, setStreamUrl] = useState<string | null>(null);

    useEffect(() => {
        async function check() {
            try {
                const res = await api.get("/stream", { silent: true });
                setStreamUrl(res.data?.streamUrl ?? null);
            } catch {
                // silently ignore — network errors shouldn't break the sheet
            }
        }

        check();
        const id = setInterval(check, pollMs);
        return () => clearInterval(id);
    }, [pollMs]);

    return streamUrl;
}
