"use client";

import { useEffect, useState } from "react";
import { Box, Stack, Button, Divider, Typography, Paper, Grid, IconButton, Skeleton } from "@mui/material";

import { Section } from "../Section";
import { SimpleListItem } from "../Jogador/SimpleListItem";
import { CharacterHeader } from "./CharacterHeader";
import { LifeBar } from "../Jogador/LifeBar";
import { AttributesChips } from "../Jogador/AttributesChips";
import RefreshIcon from '@mui/icons-material/Refresh';
import { ActionLog, ActionPresetType, Character, CharacterInventory } from "../../types/types";
import { CharacterStatsModal } from "./CharacterStatsModal";
import { useActiveCombats } from "../../lib/useActiveCombats";
import api from "../../lib/api";
import { Roller } from "../Jogador/Roller";
import { InventoryItemModal } from "../Inventory/InventoryItemModal";
import { PresetModal } from "../ActionPreset/PresetModal";
import { DiceInputRoller } from "../DiceInputRoller";
import { toast } from "react-toastify";
import { CombatCard } from "../Combat/CombatCard";


type Props = {
  characterLoaded: Character;
  isMasterView?: boolean;
  onClose?: () => void;
};

export function CharacterSheet({
  characterLoaded,
  isMasterView = false,
  onClose,
}: Props) {
  const [item, setItem] = useState<CharacterInventory | undefined>();
  const [preset, setPreset] = useState<ActionPresetType | undefined>();
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [editStatsOpen, setEditStatsOpen] = useState(false);
  const [presetOpen, setPresetOpen] = useState(false);
  const canEdit = isMasterView || characterLoaded.owner?.role === "JOGADOR";
  const { combats } = useActiveCombats();
  const [character, setCharacter] = useState<Character>(characterLoaded);
  const [actionPresets, setActionPresets] = useState<ActionPresetType[]>([]);
  const [inventory, setInventory] = useState<CharacterInventory[]>([]);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  async function getCharacter() {
    try {
      const res = await api.get(`/characters/${character.id}`);
      const characters: Character = res.data;
      setCharacter(characters);
    } catch {
      toast.error("Ocorreu um erro na requisição de obter o personagem")
    }
  }

  async function getActionPreset() {
    try {
      const res = await api.get(`/actionPreset`, { params: { characterId: character.id } });
      setActionPresets(res.data.presets);
    } catch {
      toast.error("Ocorreu um erro na requisição de obter os presets")
    }
  }
  async function getInventory() {
    try {
      const res = await api.post(`/inventory/`, { characterId: character.id, action: "list" });
      setInventory(res.data.items);
    } catch {
      toast.error("Ocorreu um erro na requisição de obter o inventario")
    }
  }
  async function getActionLogs() {
    try {
      const res = await api.get(`/actionLogs/`, { params: { characterId: character.id } });
      setActionLogs(res.data.actionLogs);
    } catch {
      toast.error("Ocorreu um erro na requisição de obter as rolagens")
    }
  }

  useEffect(() => {
    try {
      setLoading(true)
      getCharacter()
      getActionPreset()
      getInventory()
      getActionLogs()
    } finally {
      setLoading(false)
    }
  }, []);

  return (
    <Stack gap={2}>

      {!isMasterView &&
        <Paper elevation={6} sx={{ p: 3, gap: 3, marginTop: 2 }}>
          <Stack gap={3}>
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h5" fontWeight="bold">
                Combates Ativos
              </Typography>
            </Stack>

            {/* Conteúdo */}
            {loading ?
              <Grid container spacing={2}>
                {
                  Array(3)
                    .fill(1)
                    .map((item, index) => (
                      <CombatCard loading={loading} />
                    ))
                }
              </Grid> : combats.length === 0 ? (
                <Typography color="text.secondary">
                  Nenhum combate ativo no momento.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {combats.map((combat) => (
                    <CombatCard combat={combat} />
                  ))}
                </Grid >
              )}
          </Stack>
        </Paper >
      }
      {!isMasterView && !loading && <Paper elevation={2} sx={{ p: 3, gap: 3, marginTop: 2, display: "flex", justifyContent: "center" }}>
        <DiceInputRoller characterId={character.id} />
      </Paper>
      }
      <Box
        sx={{
          p: 4,
          minWidth: 650,
          maxWidth: 960,
          mx: "auto",
          background: "linear-gradient(180deg, #1e1e2f, #151521)",
          borderRadius: 3,
          color: "#fff",
          boxShadow: "0 0 40px rgba(0,0,0,.6)",
          marginBottom: 2
        }}
      >
        <Stack spacing={4}>
          {/* Cabeçalho */}
          <CharacterHeader
            loading={loading}
            character={character}
            typeAction={"edit"}
            onEditAction={() => {
              setEditStatsOpen(true)
            }} />

          {/* Vida */}
          <LifeBar loading={loading} life={character.life} maxLife={character.maxLife} />

          <Divider sx={{ borderColor: "rgba(255,255,255,.1)" }} />

          {/* Atributos */}
          <Section title="Atributos">
            <AttributesChips loading={loading} character={character} />
          </Section>

          {/* Inventário */}
          <Section
            title="Inventário"
            action={
              !loading && canEdit && (
                <Button size="small" onClick={() => setInventoryOpen(true)}>
                  Adicionar
                </Button>
              )
            }
          >
            <Stack spacing={1}>
              {loading ? Array(8)
                .fill(1)
                .map((_, index) => (
                  <SimpleListItem key={index}>
                    <Skeleton width={"100%"} />
                  </SimpleListItem>
                )) :
                inventory.length ? (
                  inventory.map((item) => (
                    <SimpleListItem
                      key={item.id}
                      editable={canEdit}
                      onEdit={() => {
                        setInventoryOpen(true)
                        setItem(item)
                      }
                      }
                    >
                      <Stack display={"flex"} flexDirection={"column"} alignItems={"flex-start"}>
                        <Stack display={"flex"} flexDirection={"row"} alignItems={"center"}>
                          {item.name}{" "}
                          {item.quantity > 1 && `x${item.quantity}`}
                        </Stack>
                        <>Descrição: {item.description}</>
                      </Stack>

                    </SimpleListItem>
                  ))
                ) : (
                  <SimpleListItem>Inventário vazio</SimpleListItem>
                )}
            </Stack>
          </Section>

          {/* Habilidades / Presets */}
          <Section
            title="Habilidades"
            action={
              !loading && canEdit && (
                <Button size="small" onClick={() => setPresetOpen(true)}>
                  Adicionar
                </Button>
              )
            }
          >
            <Stack spacing={1}>
              {loading ? Array(8)
                .fill(1)
                .map((_, index) => (
                  <SimpleListItem key={index}>
                    <Skeleton width={"100%"} />
                  </SimpleListItem>
                )) : actionPresets.length ? (
                  actionPresets.map((preset) => (preset &&
                    <SimpleListItem
                      key={preset.id}
                      editable={canEdit}
                      onEdit={() => {
                        setPresetOpen(true)
                        setPreset(preset)
                      }}
                      presetType={preset.type}
                      buttonAction={preset.type !== "REACT" && preset.type !== "SKILL" && <Roller actionPresetId={preset.id} characterId={character.id} />}
                    >
                      <Stack display={"flex"} flexDirection={"column"} alignItems={"flex-start"}>
                        <Stack display={"flex"} flexDirection={"row"} alignItems={"center"}>
                          <strong>{preset.name}</strong> —{" "}
                          {preset.diceFormula}  {/* eslint-disable  @typescript-eslint/no-explicit-any */}
                          {(character as any)[preset.attribute.toLowerCase()] > 0 ? " + " + (character as any)[preset.attribute.toLowerCase()] + " (" + preset.attribute + ")"/* eslint-disable  @typescript-eslint/no-explicit-any */
                            : undefined}{preset.modifier ? " + " + preset.modifier : undefined}
                        </Stack>
                        <>Descrição: {preset.description}</>
                      </Stack>
                    </SimpleListItem>
                  ))
                ) : (
                <SimpleListItem>
                  Nenhuma habilidade cadastrada
                </SimpleListItem>
              )}
            </Stack>
          </Section>

          {/* Status */}
          {/* {character.statusEffects.length > 0 && <Section title="Efeitos Ativos">
            <StatusEffectChips effects={character.statusEffects} />
          </Section>} */}

          {/* Rolagens */}
          <Section title="Rolagens Recentes" action={
            !loading && canEdit && (
              <IconButton size="small" onClick={() => getActionLogs()}>
                <RefreshIcon />
              </IconButton>
            )
          }>
            <Stack spacing={1}>
              {loading ? Array(8)
                .fill(1)
                .map((_, index) => (
                  <SimpleListItem key={index}>
                    <Skeleton width={"100%"} />
                  </SimpleListItem>
                )) : actionLogs && actionLogs.length ? (
                  actionLogs.map((actionLog: ActionLog) => (
                    actionLog.type !== "TURN_START" && actionLog.type !== "COMBAT_START" && actionLog.type !== "COMBAT_END" && actionLog.type !== "TURN_END" ?
                      <Stack key={actionLog.id}>
                        {(actionLog.roll && actionLog.roll?.preset) || (actionLog.type === "MANUAL_OVERRIDE" || actionLog.type === "DAMAGE" || actionLog.type === "ROLL") ?
                          <SimpleListItem key={actionLog.id + "_list"}>
                            <Stack display={"flex"} flexDirection={"column"}>
                              <Typography> {actionLog.message}</Typography>
                              {actionLog.roll?.preset && actionLog.roll ?
                                <Typography>Dados: {actionLog.roll?.preset.diceFormula}
                                  {(character as any)[actionLog.roll?.preset.attribute.toLowerCase() || 0] !== 0/* eslint-disable  @typescript-eslint/no-explicit-any */
                                    ? " + " + (character as any)[actionLog.roll?.preset.attribute.toLowerCase() || ""] + " (" + actionLog.roll?.preset.attribute + ")"/* eslint-disable  @typescript-eslint/no-explicit-any */
                                    : undefined
                                  }
                                  {actionLog.roll?.preset.modifier ? " + " + actionLog.roll?.preset.modifier : undefined} = {actionLog.roll?.total}
                                </Typography>
                                : <Typography>Dados: {actionLog.roll?.diceRolled} = {actionLog.roll?.total}
                                </Typography>
                              }</Stack>
                          </SimpleListItem>
                          :
                          <SimpleListItem key={actionLog.id}>
                            {actionLog.roll?.preset.name}: {actionLog.roll?.preset.diceFormula}
                            {(character as any)[actionLog.roll?.preset.attribute.toLowerCase() || 0] !== 0/* eslint-disable  @typescript-eslint/no-explicit-any */
                              ? " + " + (character as any)[actionLog.roll?.preset.attribute.toLowerCase() || ""] + " (" + actionLog.roll?.preset.attribute + ")"/* eslint-disable  @typescript-eslint/no-explicit-any */
                              : undefined
                            }
                            ({actionLog.roll?.preset.attribute}) + {actionLog.roll?.preset.modifier} = {actionLog.roll?.total}
                          </SimpleListItem>
                        }</Stack> : undefined

                  ))
                ) : (
                <SimpleListItem>
                  Nenhuma rolagem recente
                </SimpleListItem>
              )}
            </Stack>
          </Section>

          {/* Ações gerais */}
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            {character.owner?.role === "MESTRE" && <Button variant="outlined" onClick={onClose}>
              Fechar
            </Button>}
          </Stack>
        </Stack >
        <InventoryItemModal
          open={inventoryOpen}
          onClose={() => {
            getInventory()
            setInventoryOpen(false)
            setItem(undefined)
          }
          }
          characterId={character.id}
          item={item}
        />

        <PresetModal
          open={presetOpen}
          onClose={() => {
            getActionPreset()
            setPresetOpen(false)
            setPreset(undefined)
          }}
          characterId={character.id}
          preset={preset}
        />

        <CharacterStatsModal
          open={editStatsOpen}
          character={character}
          onClose={() => {
            getCharacter()
            setEditStatsOpen(false)
          }}
        />
      </Box >
    </Stack>
  );
}
