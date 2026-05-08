"use client";

import { useRef, useState } from "react";
import { Box, IconButton, Tooltip, Typography } from "@mui/material";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import CloseIcon from "@mui/icons-material/Close";
import LiveTvIcon from "@mui/icons-material/LiveTv";

interface Props {
  streamUrl: string;
}

export function parseEmbedUrl(url: string): string | null {
  if (!url) return null;
  const hostname = typeof window !== "undefined" ? window.location.hostname : "localhost";

  const twitchMatch = url.match(/twitch\.tv\/([^/?#]+)/);
  if (twitchMatch) {
    return `https://player.twitch.tv/?channel=${twitchMatch[1]}&parent=${hostname}&autoplay=true&muted=false`;
  }
  const ytWatch = url.match(/youtube\.com\/watch\?.*v=([^&#]+)/);
  if (ytWatch) return `https://www.youtube.com/embed/${ytWatch[1]}?autoplay=1&mute=1`;
  const ytShort = url.match(/youtu\.be\/([^?#]+)/);
  if (ytShort) return `https://www.youtube.com/embed/${ytShort[1]}?autoplay=1&mute=1`;
  const ytLive = url.match(/youtube\.com\/live\/([^?#]+)/);
  if (ytLive) return `https://www.youtube.com/embed/${ytLive[1]}?autoplay=1&mute=1`;
  return null;
}

export function StreamPiP({ streamUrl }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [dismissed, setDismissed] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const embedUrl = parseEmbedUrl(streamUrl);
  if (!embedUrl || dismissed) return null;

  function handleFullscreen() {
    // Usa a API nativa do browser — não recria o iframe, stream continua
    iframeRef.current?.requestFullscreen?.();
  }

  return (
    <Box
      sx={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 1200,
        width: collapsed ? 160 : 320,
        borderRadius: 2,
        overflow: "hidden",
        border: "1px solid rgba(107,122,219,0.4)",
        backgroundColor: "#0e0e1a",
        boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
        transition: "width 0.25s ease",
      }}
    >
      {/* Barra de controle */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          px: 1,
          py: 0.5,
          backgroundColor: "rgba(107,122,219,0.15)",
          gap: 0.5,
          cursor: collapsed ? "pointer" : "default",
          userSelect: "none",
        }}
        onClick={collapsed ? () => setCollapsed(false) : undefined}
      >
        <LiveTvIcon sx={{ fontSize: 14, color: "#6B7ADB", flexShrink: 0 }} />
        <Typography
          variant="caption"
          sx={{
            color: "#8B9DFF",
            fontWeight: 600,
            flex: 1,
            fontSize: 11,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {collapsed ? "Stream" : "Stream ao vivo"}
        </Typography>

        {!collapsed && (
          <Tooltip title="Tela cheia">
            <IconButton
              size="small"
              onClick={handleFullscreen}
              sx={{ color: "#555", p: 0.25, "&:hover": { color: "#aaa" } }}
            >
              <FullscreenIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        )}

        <Tooltip title={collapsed ? "Expandir" : "Minimizar"}>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); setCollapsed((v) => !v); }}
            sx={{ color: "#555", p: 0.25, "&:hover": { color: "#aaa" } }}
          >
            <Typography sx={{ fontSize: 12, lineHeight: 1, color: "inherit" }}>
              {collapsed ? "▲" : "▼"}
            </Typography>
          </IconButton>
        </Tooltip>

        <Tooltip title="Fechar">
          <IconButton
            size="small"
            onClick={() => setDismissed(true)}
            sx={{ color: "#555", p: 0.25, "&:hover": { color: "#f87171" } }}
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/*
        Iframe SEMPRE montado — colapsar usa height:0 + overflow:hidden
        para não pausar a reprodução (diferente de display:none).
      */}
      <Box
        sx={{
          height: collapsed ? 0 : "auto",
          overflow: "hidden",
          transition: "height 0.25s ease",
        }}
      >
        <Box sx={{ width: "100%", aspectRatio: "16/9" }}>
          <iframe
            ref={iframeRef}
            src={embedUrl}
            style={{ width: "100%", height: "100%", border: "none", display: "block" }}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </Box>
      </Box>
    </Box>
  );
}
