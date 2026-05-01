import {
  Card,
  CardContent,
  CardActions,
  Stack,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { Character } from "../../types/types";
import { LifeBar } from "../Jogador/LifeBar";
import { AttributesChips } from "../Jogador/AttributesChips";
import { CharacterHeader } from "./CharacterHeader";
import { useState } from "react";
import api from "../../lib/api";
import { toast } from "react-toastify";

type Props = {
  character: Character;
  onAcess: () => void;
  onDelete?: () => void;
};

export function CharacterCard({
  character,
  onAcess = () => {},
  onDelete,
}: Props) {
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const handleDelete = async () => {
    try {
      await api.delete(`/characters/${character.id}`);
      toast.success("Personagem deletado com sucesso");
      setOpenDeleteDialog(false);
      onDelete?.();
    } catch (error) {
      const axiosError = error as Record<string, Record<string, unknown>>;
      console.log("Erro ao deletar personagem:", axiosError);
      toast.error("Erro ao deletar personagem");
    }
  };

  return (
    <Card
      sx={{
        width: 280,
        display: "flex",
        flexDirection: "column",
        background:
          "linear-gradient(135deg, rgba(28, 28, 46, 0.6) 0%, rgba(14, 14, 26, 0.8) 100%)",
        border: "1px solid rgba(107, 122, 219, 0.2)",
        transition: "all 0.3s ease",
        "&:hover": {
          border: "1px solid rgba(107, 122, 219, 0.5)",
          boxShadow: "0 0 16px rgba(107, 122, 219, 0.3)",
        },
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <CharacterHeader typeAction="view" character={character} />

          <LifeBar life={character.life} maxLife={character.maxLife} />

          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
            <Chip
              label={`🛡️ DEF: ${character.baseDefense ?? 0}`}
              size="small"
              sx={{
                backgroundColor: "rgba(102, 187, 106, 0.2)",
                color: "#66bb6a",
                border: "1px solid rgba(102, 187, 106, 0.5)",
              }}
            />
          </Box>

          <Divider sx={{ my: 1, borderColor: "rgba(51, 51, 51, 0.5)" }} />

          <Box>
            <Typography fontSize={12} color="#aaa" fontWeight="bold" mb={1}>
              Atributos
            </Typography>
            <AttributesChips character={character} compact />
          </Box>

          {character.history && (
            <>
              <Divider sx={{ my: 1, borderColor: "rgba(51, 51, 51, 0.5)" }} />
              <Box>
                <Typography
                  fontSize={11}
                  color="#aaa"
                  fontWeight="bold"
                  mb={0.5}
                >
                  Histórico
                </Typography>
                <Typography
                  fontSize={11}
                  color="#999"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {character.history}
                </Typography>
              </Box>
            </>
          )}
        </Stack>
      </CardContent>
      <CardActions sx={{ pt: 0, gap: 1 }}>
        <Button
          variant="contained"
          size="small"
          onClick={() => onAcess()}
          fullWidth
        >
          Acessar Ficha
        </Button>
        <Button
          variant="outlined"
          size="small"
          color="error"
          onClick={() => setOpenDeleteDialog(true)}
        >
          🗑️
        </Button>
      </CardActions>

      <Dialog
        open={openDeleteDialog}
        onClose={() => setOpenDeleteDialog(false)}
      >
        <DialogTitle>Confirmar Exclusão</DialogTitle>
        <DialogContent>
          <Typography>
            Tem certeza que deseja deletar <strong>{character.name}</strong>?
            Esta ação não pode ser desfeita.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancelar</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>
            Deletar
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}
