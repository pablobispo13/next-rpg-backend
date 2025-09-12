"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
import CharacterCard from "../../components/CharacterCard";
import EditCharacterModal from "../../components/EditCharacterModal";
import { Box, Typography, Button } from "@mui/material";
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

export default function Mesa() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [editing, setEditing] = useState<Character | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    setToken(t);

    const fetchCharacters = async () => {
      if (!t) return;
      try {
        const res = await axios.get("/api/characters", {
          headers: { Authorization: `Bearer ${t}` },
        });
        setCharacters(res.data.characters);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCharacters();

    const eventSource = new EventSource("/api/stream");
    eventSource.onmessage = (event) => {
      const data: Character[] = JSON.parse(event.data);
      setCharacters(data);
    };

    return () => eventSource.close();
  }, [token]);

  const handleSave = () => {
    console.log("Personagem salvo. SSE atualiza automaticamente.");
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
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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
        <Typography variant="h4" gutterBottom>Mesa do Mestre</Typography>
        <Button variant="contained" sx={{ mb: 2 }} onClick={handleCreate}>
          Criar Novo Personagem
        </Button>

        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
          {characters.map((char) => (
            <CharacterCard
              key={char.id}
              character={char}
              onEdit={() => setEditing(char)}
            />
          ))}
        </Box>
      </Box>

      {editing && (
        <EditCharacterModal
          character={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}
    </>
  );
}
