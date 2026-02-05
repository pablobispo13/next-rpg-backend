"use client";

import { useState } from "react";
import { Box, Stack, Button, Divider, Typography, Paper, Grid, Card, CardContent, Chip, CardActions } from "@mui/material";

import { Section } from "../Section";
import { SimpleListItem } from "../Jogador/SimpleListItem";
import { StatusEffectChips } from "../Jogador/StatusEffectChips";
import { CharacterHeader } from "./CharacterHeader";
import { LifeBar } from "../Jogador/LifeBar";
import { AttributesChips } from "../Jogador/AttributesChips";


import { ActionLog, ActionPresetType, Character, CharacterInventory } from "../../types/types";

import { CharacterStatsModal } from "./CharacterStatsModal";
import { useActiveCombats } from "../../lib/useActiveCombats";

import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import api from "../../lib/api";
import { Roller } from "../Jogador/Roller";
import { InventoryItemModal } from "../Inventory/InventoryItemModal";
import { PresetModal } from "../ActionPreset/PresetModal";


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

  async function getCharacter() {

    try {
      const res = await api.get(`/characters/${character.id}`);
      const characters: Character = res.data;
      setCharacter(characters);
    } finally {
    }
  }

  return (
    <>
      {!isMasterView &&
        <Paper elevation={6} sx={{ p: 3 }}>
          <Stack gap={3}>
            {/* Header */}
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="h5" fontWeight="bold">
                Combates Ativos
              </Typography>
            </Stack>

            {/* Conteúdo */}
            {combats.length === 0 ? (
              <Typography color="text.secondary">
                Nenhum combate ativo no momento.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {combats.map((c) => (
                  <Grid container key={c.id}>
                    <Card
                      sx={{
                        height: "100%",
                        background: "linear-gradient(145deg, #1c1c2e, #23233a)",
                        border: "1px solid #333",
                      }}
                    >
                      <CardContent>
                        <Stack gap={1}>
                          <Typography variant="h6">
                            {`Combate`}
                          </Typography>

                          <Typography variant="caption" color="text.secondary">
                            ID: {c.id}
                          </Typography>

                          <Chip
                            label="Em andamento"
                            color="success"
                            size="small"
                            sx={{ width: "fit-content", mt: 1 }}
                          />
                        </Stack>
                      </CardContent>

                      <CardActions>
                        <Button
                          fullWidth
                          variant="outlined"
                          endIcon={<OpenInNewIcon />}
                          onClick={() =>
                            window.open(
                              `/protected/combat?combatId=${c.id}`,
                              "_blank",
                              "noopener,noreferrer"
                            )
                          }
                        >
                          Abrir combate
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Stack>
        </Paper >
      }
      <Box
        sx={{
          p: 4,
          maxWidth: 960,
          mx: "auto",
          background: "linear-gradient(180deg, #1e1e2f, #151521)",
          borderRadius: 3,
          color: "#fff",
          boxShadow: "0 0 40px rgba(0,0,0,.6)",
        }}
      >
        <Stack spacing={4}>
          {/* Cabeçalho */}
          <CharacterHeader
            character={character}
            typeAction={"edit"}
            onEditAction={() => {
              setEditStatsOpen(true)
            }} />

          {/* Vida */}
          <LifeBar life={character.life} maxLife={character.maxLife} />

          <Divider sx={{ borderColor: "rgba(255,255,255,.1)" }} />

          {/* Atributos */}
          <Section title="Atributos">
            <AttributesChips character={character} />
          </Section>

          {/* Inventário */}
          <Section
            title="Inventário"
            action={
              canEdit && (
                <Button size="small" onClick={() => setInventoryOpen(true)}>
                  Adicionar
                </Button>
              )
            }
          >
            <Stack spacing={1}>
              {character.inventory.length ? (
                character.inventory.map((item) => (
                  <SimpleListItem
                    key={item.id}
                    editable={canEdit}
                    onEdit={() => {
                      setInventoryOpen(true)
                      setItem(item)
                    }
                    }
                  >
                    {item.name}{" "}
                    {item.quantity > 1 && `x${item.quantity}`}
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
              canEdit && (
                <Button size="small" onClick={() => setPresetOpen(true)}>
                  Adicionar
                </Button>
              )
            }
          >
            <Stack spacing={1}>
              {character.presets.length ? (
                character.presets.map((preset) => (preset &&
                  < SimpleListItem
                    key={preset.id}
                    editable={canEdit}
                    onEdit={() => {
                      setPresetOpen(true)
                      setPreset(preset)
                    }}
                    buttonAction={<Roller actionPresetId={preset.id} characterId={character.id} />}
                  >
                    <Stack display={"flex"} flexDirection={"row"} alignItems={"center"}>
                      <>
                        <strong>{preset.name}</strong> —{" "}
                        {preset.diceFormula}/* eslint-disable  @typescript-eslint/no-explicit-any */
                        {(character as any)[preset.attribute.toLowerCase()] > 0 ? " + " + (character as any)[preset.attribute.toLowerCase()] + " (" + preset.attribute + ")"/* eslint-disable  @typescript-eslint/no-explicit-any */
                          : undefined}{preset.modifier ? " + " + preset.modifier : undefined}
                      </>
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
          {character.statusEffects.length > 0 && <Section title="Efeitos Ativos">
            <StatusEffectChips effects={character.statusEffects} />
          </Section>}

          {/* Rolagens */}
          <Section title="Rolagens Recentes">
            <Stack spacing={1}>
              {character.actionLogs.length ? (
                character.actionLogs.map((actionLog: ActionLog) => (
                  actionLog.type !== "TURN_START" && actionLog.type !== "COMBAT_START" && actionLog.type !== "COMBAT_END" && actionLog.type !== "TURN_END" ?
                    <Stack key={actionLog.id}>
                      {(actionLog.roll && actionLog.roll?.preset) || (actionLog.type === "MANUAL_OVERRIDE" || actionLog.type === "DAMAGE" || actionLog.type === "ROLL") ?
                        <SimpleListItem key={actionLog.id + "_list"}>
                          <Stack display={"flex"} flexDirection={"column"}>
                            <Typography> {actionLog.message}</Typography>
                            {actionLog.roll ?
                              <Typography>Dados: {actionLog.roll?.preset.diceFormula}

                                {(character as any)[actionLog.roll?.preset.attribute.toLowerCase() || 0] !== 0/* eslint-disable  @typescript-eslint/no-explicit-any */
                                  ? " + " + (character as any)[actionLog.roll?.preset.attribute.toLowerCase() || ""] + " (" + actionLog.roll?.preset.attribute + ")"/* eslint-disable  @typescript-eslint/no-explicit-any */
                                  : undefined
                                }
                                {actionLog.roll?.preset.modifier ? " + " + actionLog.roll?.preset.modifier : undefined} = {actionLog.roll?.total}
                              </Typography>
                              : undefined
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
            getCharacter()
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
            getCharacter()
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
    </>
  );
}
