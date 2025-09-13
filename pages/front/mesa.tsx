"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Header from "../../components/Header";
import CharacterCard from "../../components/CharacterCard";
import EditCharacterModal from "../../components/EditCharacterModal";
import { Box, Typography, Button, Alert } from "@mui/material";
import axios from "axios";

type Character = {
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
  owner?: { username: string };
};

export default function MesaUnificadaFinal() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [editing, setEditing] = useState<Character | null>(null);
  const [viewing, setViewing] = useState<Character | null>(null);

  const [userId, setUserId] = useState("");
  const [token, setToken] = useState("");
  const [isMaster, setIsMaster] = useState(false);

  const [hasUpdates, setHasUpdates] = useState(false);
  const [roomToken, setRoomToken] = useState(""); // token da sala para identificar a mesa
  const pendingUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const justSavedRef = useRef(false); // para controlar se acabamos de salvar

  useEffect(() => {
    if (typeof window !== "undefined") {
      setUserId(localStorage.getItem("userId") || "");
      setToken(localStorage.getItem("token") || "");
      setIsMaster(Boolean(localStorage.getItem("role")));
    }
  }, []);

  const fetchCharacters = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get("/api/characters", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCharacters(res.data.characters);
      if (res.data.roomToken) setRoomToken(res.data.roomToken); // pega token da sala do backend
    } catch (err) {
      console.error(err);
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;

    fetchCharacters(); // fetch inicial

    const es = new EventSource("/api/stream");

    es.onmessage = (event) => {
      const data = JSON.parse(event.data) as { characters: Character[]; roomToken: string };

      if (pendingUpdateRef.current) clearTimeout(pendingUpdateRef.current);
      pendingUpdateRef.current = setTimeout(() => {
        setRoomToken(data.roomToken);

        setCharacters((prev) =>
          data.characters.map((serverChar) => {
            if (justSavedRef.current && editing?.id === serverChar.id) return editing;
            if (viewing?.id === serverChar.id) return viewing;
            return serverChar;
          })
        );

        justSavedRef.current = false;
      }, 100);
    };

    es.onerror = () => {
      es.close();
      setTimeout(() => {
        if (typeof window !== "undefined") {
          const newEs = new EventSource("/api/stream");
        }
      }, 5000);
    };

    return () => {
      es.close();
      if (pendingUpdateRef.current) clearTimeout(pendingUpdateRef.current);
    };
  }, [token]); // ⚠️ depender apenas do token


  const handleSave = async (updated: Character) => {
    if (!token) return;
    try {
      await axios.put(`/api/characters/${updated.id}`, updated, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setCharacters((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

      // Evita que o SSE sobrescreva a modal
      justSavedRef.current = true;
      setEditing(null); // fecha modal

      setHasUpdates(false);
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
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <>
      <Header />
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>
          Mesa de Personagens {isMaster ? "(Mestre)" : ""} — Sala: {roomToken || "..."}
        </Typography>

        {hasUpdates && (
          <Alert severity="info" sx={{ mb: 2 }}>
            A mesa foi atualizada em tempo real!
          </Alert>
        )}

        {isMaster && (
          <Button variant="contained" sx={{ mb: 2 }} onClick={handleCreate}>
            Criar Novo Personagem
          </Button>
        )}

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {characters.map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              canEdit={isMaster || char.ownerId === userId}
              onEdit={() => setEditing(char)}
              onView={() => setViewing(char)}
            />
          ))}
        </Box>
      </Box>

      {editing && (
        <EditCharacterModal
          character={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
          canSave={true}
        />
      )}

      {viewing && (
        <EditCharacterModal
          character={viewing}
          onClose={() => setViewing(null)}
          onSave={() => { }}
          canSave={false}
        />
      )}
    </>
  );
}
