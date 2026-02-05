"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Box, Typography, Button, Stack } from "@mui/material";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import api, { handleLogout } from "../../lib/api";

export type Character = {
    id: string;
    name: string;
    life: number;
    xp: number;
    agility: number;
    strength: number;
    vigor: number;
    presence: number;
    intellect: number;
    ownerId: string;
    owner?: { username: string; role: "MESTRE" | "JOGADOR" };
};

export default function MesaTeste() {
    const router = useRouter();
    const { user } = useAuth();
    const [characters, setCharacters] = useState<Character[]>([]);
    const [editing, setEditing] = useState<Character | null>(null);
    const [viewing, setViewing] = useState<Character | null>(null);
    const [openModal, setOpenModal] = useState<boolean>(false);
    const [token, setToken] = useState("");
    const [roomToken, setRoomToken] = useState("");
    const pendingUpdateRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!token && !user) {
            handleLogout("expired")
        }
    }, [user, token, router]);

    useEffect(() => {
        if (typeof window !== "undefined") {
            const localToken = localStorage.getItem("token");
            if (localToken) setToken(localToken);
        }
    }, []);

    const fetchCharacters = useCallback(async () => {
        if (!token) return;
        try {
            const res = await api.get("/characters", {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCharacters(res.data.characters);
            if (res.data.roomToken) setRoomToken(res.data.roomToken);
        } catch (err) {
            console.error(err);
        }
    }, [token]);

    useEffect(() => {
        if (!token) return;

        fetchCharacters();
        const es = new EventSource(`/api/stream?token=${token}`);

        es.onmessage = (event) => {
            const data = JSON.parse(event.data) as {
                characters: Character[];
                roomToken: string;
            };

            if (pendingUpdateRef.current) clearTimeout(pendingUpdateRef.current);

            pendingUpdateRef.current = setTimeout(() => {
                setRoomToken(data.roomToken);
                // sempre use os dados do servidor, evita o "pulo" do personagem
                setCharacters(data.characters);
            }, 100);
        };

        es.onerror = () => {
            es.close();
            setTimeout(() => {
                if (typeof window !== "undefined") {
                    new EventSource(`/api/stream?token=${token}`);
                }
            }, 5000);
        };

        return () => {
            es.close();
            if (pendingUpdateRef.current) clearTimeout(pendingUpdateRef.current);
        };
    }, [token, fetchCharacters]);

    const handleSave = async (updated: Character) => {
        if (!token) return;
        try {
            const res = await api.put(`/characters/${updated.id}`, updated, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setCharacters((prev) =>
                prev.map((c) => (c.id === res.data.id ? res.data : c))
            );
            setEditing(null);
            setOpenModal(false);
            toast.success("Personagem editado com sucesso!")
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = async () => {
        if (!token) return;
        try {
            const res = await api.post(
                "/characters",
                {
                    name: "Novo Personagem",
                    life: 100,
                    xp: 0,
                    agility: 10,
                    strength: 10,
                    vigor: 10,
                    presence: 10,
                    intellect: 10,
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setEditing(res.data);
            setOpenModal(true);
        } catch (err) {
            console.error(err);
        }
    };

    if (!user) return <>Carregando informações...</>;

    return (
        <>
            <Box sx={{ p: 4 }}>
                <Typography variant="h4" gutterBottom>
                    Mesa de Personagens {user?.role === "MESTRE" ? "(Mestre)" : ""} — Sala:{" "}
                    {roomToken || "..."}
                </Typography>

                {user?.role === "MESTRE" && (
                    <Button variant="contained" sx={{ mb: 2 }} onClick={handleCreate}>
                        Criar Novo Personagem
                    </Button>
                )}

                <Stack display={"flex"} gap={2}>
                    {user?.role === "MESTRE" && (
                        <>
                            Personagens do mestre
                            <Stack sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
                                {characters
                                    .filter((char) => char.owner?.role === "MESTRE")
                                    .map((char) => (
                                        <></>
                                    ))}
                            </Stack>
                        </>
                    )}

                    Personagens
                    <Stack sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
                        {characters
                            .filter((char) => char.owner?.role !== "MESTRE")
                            .map((char) => (
                                <></>
                            ))}
                    </Stack>
                </Stack>
            </Box>
        </>
    );
}
