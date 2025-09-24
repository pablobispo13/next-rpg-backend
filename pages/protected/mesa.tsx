"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import CharacterCard from "../components/CharacterCard";
import EditCharacterModal from "../components/EditCharacterModal";
import { Box, Typography, Button, Stack } from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";
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
  const pendingUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const justSavedRef = useRef(false);

  // 🔹 Sempre executa o hook, só redireciona caso não tenha usuário
  useEffect(() => {
    if (!user) {
      router.push("/login");
    }
  }, [user, router]);

  // 🔹 Sempre chamado
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

  useEffect(() => {
    if (!token) return;

    fetchCharacters();
    const es = new EventSource("/api/stream");

    es.onmessage = (event) => {
      const data = JSON.parse(event.data) as {
        characters: Character[];
        roomToken: string;
      };
      if (pendingUpdateRef.current) clearTimeout(pendingUpdateRef.current);
      pendingUpdateRef.current = setTimeout(() => {
        setRoomToken(data.roomToken);
        setCharacters(() =>
          data.characters.map((serverChar) => {
            if (justSavedRef.current && editing?.id === serverChar.id)
              return editing;
            if (viewing?.id === serverChar.id) return viewing;
            return serverChar;
          })
        );
        toast.info("Mudanças foram aplicadas!");
        justSavedRef.current = false;
      }, 100);
    };

    es.onerror = () => {
      es.close();
      setTimeout(() => {
        if (typeof window !== "undefined") {
          new EventSource("/api/stream");
        }
      }, 5000);
    };

    return () => {
      es.close();
      if (pendingUpdateRef.current) clearTimeout(pendingUpdateRef.current);
    };
  }, [token, fetchCharacters, editing, viewing]);

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

  // 🔹 Renderização condicional só no return (não antes dos hooks)
  if (!user) {
    return <></>;
  }

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
                {characters.filter((char) => char.owner?.role === "MESTRE").map(
                  (char) =>
                    <CharacterCard
                      key={char.id}
                      edit={
                        user?.role === "MESTRE" || char.ownerId === user.id
                      }
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
                )}
              </Stack>
            </>
          )}
          Personagens
          <Stack sx={{ display: "flex", flexDirection: "row", gap: 2 }}>
            {characters.filter((char) => char.owner?.role !== "MESTRE").map(
              (char) =>
                <CharacterCard
                  key={char.id}
                  edit={
                    user?.role === "MESTRE" || char.ownerId === user.id
                  }
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
            )}
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
