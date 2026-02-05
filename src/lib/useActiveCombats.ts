// useActiveCombats.ts
import { useEffect, useState } from "react";
import api from "../lib/api";
import { Combat } from "@prisma/client";

export function useActiveCombats() {
    const [combats, setCombats] = useState<Combat[]>([]);
    const [loading, setLoading] = useState(true);

    async function loadCombats() {
        setLoading(true);
        const res = await api.get("/combat/active");
        setCombats(res.data);
        setLoading(false);
    }

    useEffect(() => {
        loadCombats();
    }, []);

    return { combats, loading, reload: loadCombats };
}