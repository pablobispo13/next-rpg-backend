"use client";

import { useEffect, useState } from "react";
import { Avatar, Box, Stack, Typography, Skeleton, Tooltip } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import BlockIcon from "@mui/icons-material/Block";
import api from "../../lib/api";

type Props = {
  value: string;
  onChange: (filename: string) => void;
};

/**
 * Grid de seleção de imagens. Visível apenas para o admin.
 * Lista os arquivos em public/characters/ via /api/admin/images.
 * Para adicionar novas imagens: arquivo em public/characters/ + deploy.
 */
export function ImagePicker({ value, onChange }: Props) {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/admin/images", { silent: true })
      .then((res) => setImages(res.data.images ?? []))
      .catch(() => setImages([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Skeleton variant="rounded" height={120} />;
  }

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" mb={1} display="block">
        Escolha uma imagem da biblioteca (admin)
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {/* Opção "sem imagem" */}
        <Tooltip title="Sem imagem">
          <Box
            onClick={() => onChange("")}
            sx={{
              width: 64, height: 64,
              borderRadius: 1,
              border: !value ? "2px solid #8B9DFF" : "2px solid transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              background: "rgba(255,255,255,0.04)",
              cursor: "pointer",
              position: "relative",
              "&:hover": { background: "rgba(255,255,255,0.08)" },
            }}
          >
            <BlockIcon sx={{ color: "#666" }} />
            {!value && (
              <CheckCircleIcon sx={{
                position: "absolute", top: -6, right: -6, fontSize: 18,
                color: "#8B9DFF", background: "#12121e", borderRadius: "50%",
              }} />
            )}
          </Box>
        </Tooltip>

        {images.map((filename) => {
          const isSelected = value === filename;
          return (
            <Tooltip key={filename} title={filename}>
              <Box
                onClick={() => onChange(filename)}
                sx={{
                  width: 64, height: 64,
                  borderRadius: 1,
                  border: isSelected ? "2px solid #8B9DFF" : "2px solid transparent",
                  position: "relative",
                  cursor: "pointer",
                  overflow: "hidden",
                  "&:hover": { transform: "scale(1.05)" },
                  transition: "transform 0.15s",
                }}
              >
                <Avatar
                  src={`/characters/${filename}`}
                  variant="rounded"
                  sx={{ width: "100%", height: "100%" }}
                />
                {isSelected && (
                  <CheckCircleIcon sx={{
                    position: "absolute", top: -6, right: -6, fontSize: 18,
                    color: "#8B9DFF", background: "#12121e", borderRadius: "50%",
                  }} />
                )}
              </Box>
            </Tooltip>
          );
        })}

        {images.length === 0 && (
          <Typography variant="caption" color="text.disabled">
            Nenhuma imagem disponível. Coloque arquivos em <code>public/characters/</code> e faça deploy.
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
