"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import CharacterCard from "../components/CharacterCard";
import EditCharacterModal from "../components/EditCharacterModal";
import { Box, Typography, Button, Stack } from "@mui/material";
import axios from "axios";
import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthContext";

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

export default function MesaUnificadaFinal() {
  const router = useRouter();
  const { user } = useAuth();

  const [characters, setCharacters] = useState<Character[]>([]);
  const [editing, setEditing] = useState<Character | null>(null);
  const [viewing, setViewing] = useState<Character | null>(null);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [token, setToken] = useState("");
  const [roomToken, setRoomToken] = useState("");

  const eventSourceRef = useRef<EventSource | null>(null);
  const pendingUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const justSavedRef = useRef(false);

  const editingRef = useRef<Character | null>(null);
  const viewingRef = useRef<Character | null>(null);

  useEffect(() => { editingRef.current = editing; }, [editing]);
  useEffect(() => { viewingRef.current = viewing; }, [viewing]);

  useEffect(() => {
    if (!user) router.push("/login");
  }, [user, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const localToken = localStorage.getItem("token");
      if (localToken) setToken(localToken);
    }
  }, []);

  const fetchCharacters = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get("/api/characters", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCharacters(res.data.characters);
      if (res.data.roomToken) setRoomToken(res.data.roomToken);
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  const handleMessage = useCallback((event: MessageEvent) => {
    const data = JSON.parse(event.data) as { characters: Character[]; roomToken: string };

    if (pendingUpdateRef.current) clearTimeout(pendingUpdateRef.current);

    pendingUpdateRef.current = setTimeout(() => {
      setRoomToken(data.roomToken);

      setCharacters((prev) =>
        data.characters.map((serverChar) => {
          if (justSavedRef.current && editingRef.current?.id === serverChar.id) return editingRef.current;

          if (viewingRef.current?.id === serverChar.id) return viewingRef.current;

          const existing = prev.find((c) => c.id === serverChar.id);

          if (
            existing &&
            existing.name === serverChar.name &&
            existing.life === serverChar.life &&
            existing.xp === serverChar.xp &&
            existing.agility === serverChar.agility &&
            existing.strength === serverChar.strength &&
            existing.vigor === serverChar.vigor &&
            existing.presence === serverChar.presence &&
            existing.intellect === serverChar.intellect
          ) {
            return existing;
          }

          return serverChar;
        })
      );

      justSavedRef.current = false;
    }, 100);
  }, []);


  const connectStream = useCallback(() => {
    if (!token) return;
    if (eventSourceRef.current) return;

    const es = new EventSource("/api/stream");
    eventSourceRef.current = es;

    es.onmessage = handleMessage;

    es.onerror = () => {
      es.close();
      eventSourceRef.current = null;
      setTimeout(() => {
        if (!eventSourceRef.current) connectStream();
      }, 5000);
    };
  }, [handleMessage, token]);

  useEffect(() => {
    if (!token) return;
    fetchCharacters();
    connectStream();

    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      if (pendingUpdateRef.current) clearTimeout(pendingUpdateRef.current);
    };
  }, [token, fetchCharacters, connectStream]);

  const handleSave = async (updated: Character) => {
    if (!token) return;
    try {
      await axios.put(`/api/characters/${updated.id}`, updated, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCharacters((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      justSavedRef.current = true;
      setEditing(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async () => {
    if (!token) return;
    try {
      const res = await axios.post(
        "/api/characters",
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

  if (!user) return <></>;

  const mestreCharacters = characters.filter((c) => c.owner?.role === "MESTRE");
  const jogadorCharacters = characters.filter((c) => c.owner?.role !== "MESTRE");

  return (
    <>
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Mesa de Personagens {user?.role === "MESTRE" ? "(Mestre)" : ""} — Sala: {roomToken || "..."}
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
                {mestreCharacters.map((char) => (
                  <CharacterCard
                    key={char.id}
                    edit={user?.role === "MESTRE" || char.ownerId === user.id}
                    character={char}
                    onEdit={() => {
                      setOpenModal(true);
                      setEditing(char);
                    }}
                    onView={() => {
                      setViewing(char);
                      setOpenModal(true);
                    }}
                  />
                ))}
              </Stack>
            </>
          )}

          Personagens
          <Stack sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
            {jogadorCharacters.map((char) => (
              <CharacterCard
                key={char.id}
                edit={user?.role === "MESTRE" || char.ownerId === user.id}
                character={char}
                onEdit={() => {
                  setOpenModal(true);
                  setEditing(char);
                }}
                onView={() => {
                  setViewing(char);
                  setOpenModal(true);
                }}
              />
            ))}
          </Stack>
        </Stack>
      </Box>

      {openModal && editing && (
        <EditCharacterModal
          open={openModal}
          character={editing}
          onSave={handleSave}
          onClose={() => {
            setEditing(null);
            setOpenModal(false);
          }}
        />
      )}

      {openModal && viewing && (
        <EditCharacterModal
          open={openModal}
          character={viewing}
          visualization
          onClose={() => {
            setViewing(null);
            setOpenModal(false);
          }}
        />
      )}
    </>
  );
}
