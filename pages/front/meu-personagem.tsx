"use client";

import { useEffect, useState } from "react";
import Header from "../../components/Header";
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
};

export default function MeuPersonagem() {
  const [character, setCharacter] = useState<Character | null>(null);
  const [editing, setEditing] = useState<Character | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const t = localStorage.getItem("token");
    const u = localStorage.getItem("userId");
    setToken(t);
    setUserId(u);

    const fetchCharacter = async () => {
      if (!t) return;
      try {
        const res = await axios.get("/api/characters", {
          headers: { Authorization: `Bearer ${t}` },
        });
        if (res.data.characters.length > 0) {
          setCharacter(res.data.characters[0]);
        }
      } catch (err) {
        console.error(err);
      }
    };

    fetchCharacter();

    const eventSource = new EventSource("/api/stream");
    eventSource.onmessage = (event) => {
      const data: Character[] = JSON.parse(event.data);
      const myChar = data.find((c) => c.ownerId === userId);
      if (myChar) setCharacter(myChar);
    };

    return () => eventSource.close();
  }, [token, userId]);

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
      setCharacter(res.data);
      setEditing(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!character)
    return (
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>Meu Personagem</Typography>
        <Typography>Você ainda não possui um personagem.</Typography>
        <Button variant="contained" sx={{ mt: 2 }} onClick={handleCreate}>
          Criar Personagem
        </Button>
      </Box>
    );

  return (
    <>
      <Header />
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>Meu Personagem</Typography>
        <Typography>Nome: {character.name}</Typography>
        <Typography>Life: {character.life}</Typography>
        <Typography>XP: {character.xp}</Typography>
        <Typography>Agility: {character.agility}</Typography>
        <Typography>Strength: {character.strength}</Typography>
        <Typography>Vigor: {character.vigor}</Typography>
        <Typography>Presence: {character.presence}</Typography>
        <Typography>Intellect: {character.intellect}</Typography>

        <Button variant="contained" sx={{ mt: 2 }} onClick={() => setEditing(character)}>
          Editar
        </Button>
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
