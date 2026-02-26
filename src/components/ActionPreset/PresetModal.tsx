"use client";

import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Stack,
    MenuItem,
    Switch,
    FormControlLabel,
    Divider,
} from "@mui/material";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import { ActionPresetType } from "../../types/types";

type Props = {
    open: boolean;
    characterId: string;
    preset?: ActionPresetType;
    onClose: () => void;
};

export function PresetModal({
    open,
    characterId,
    preset,
    onClose,
}: Props) {
    const [form, setForm] = useState({
        name: "",
        description: "",
        type: "ATTACK",
        targetType: "ENEMY",
        attribute: "STRENGTH",
        diceFormula: "1d20",
        impactFormula: "",
        modifier: 0,
        critThreshold: 20,
        critMultiplier: 2,
        requiresTurn: true,
        allowOutOfCombat: false,
        appliesEffect: false,
        durationTurns: "",
        statAffected: "",
        effectAmount: "",
        statusApplied: "",
    });

    useEffect(() => {
        if (preset) {
            setForm({
                name: preset.name,
                description: preset.description ?? "",
                type: preset.type,
                targetType: preset.targetType,
                attribute: preset.attribute,
                diceFormula: preset.diceFormula,
                impactFormula: preset.impactFormula,
                modifier: preset.modifier ?? 0,
                critThreshold: preset.critThreshold ?? 20,
                critMultiplier: preset.critMultiplier ?? 2,
                requiresTurn: preset.requiresTurn ?? true,
                allowOutOfCombat: preset.allowOutOfCombat ?? false,
                appliesEffect: preset.appliesEffect ?? false,
                durationTurns: preset.durationTurns?.toString() ?? "",
                statAffected: preset.statAffected ?? "",
                effectAmount: preset.effectAmount?.toString() ?? "",
                statusApplied: preset.statusApplied ?? "",
            });
        }
    }, [preset, open]);

    const update = (key: string, value: any) =>/* eslint-disable  @typescript-eslint/no-explicit-any */
        setForm((prev) => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        if (preset?.id) {
            await api.put(`/actionPreset/${preset?.id}`, {
                ...form,
                modifier: Number(form.modifier),
                critThreshold: Number(form.critThreshold),
                critMultiplier: Number(form.critMultiplier),
                durationTurns: form.durationTurns ? Number(form.durationTurns) : null,
                effectAmount: form.effectAmount ? Number(form.effectAmount) : null,
                statAffected: form.statAffected ? Number(form.statAffected) : null,
                statusApplied: form.statusApplied ? Number(form.statusApplied) : null,
                characterId,
            });


        }
        else
            await api.post(`/actionPreset`, {
                ...form,
                modifier: Number(form.modifier),
                critThreshold: Number(form.critThreshold),
                critMultiplier: Number(form.critMultiplier),
                durationTurns: form.durationTurns ? Number(form.durationTurns) : null,
                effectAmount: form.effectAmount ? Number(form.effectAmount) : null,
                statAffected: form.statAffected ? Number(form.statAffected) : null,
                statusApplied: form.statusApplied ? Number(form.statusApplied) : null,
                characterId,
            });

        onClose();
    };

    return (
        <Dialog open={open} onClose={() => {
            setForm({
                name: "",
                description: "",
                type: "ATTACK",
                targetType: "ENEMY",
                attribute: "STRENGTH",
                diceFormula: "1d20",
                impactFormula: "",
                modifier: 0,
                critThreshold: 20,
                critMultiplier: 2,
                requiresTurn: true,
                allowOutOfCombat: false,
                appliesEffect: false,
                durationTurns: "",
                statAffected: "",
                effectAmount: "",
                statusApplied: "",
            })
            onClose()
        }} maxWidth="md" fullWidth>
            <DialogTitle>
                {preset ? "Editar Preset" : "Novo Preset"}
            </DialogTitle>

            <DialogContent>
                <Stack spacing={2} sx={{ mt: 1 }}>
                    {/* Básico */}
                    <TextField label="Nome" value={form.name} onChange={e => update("name", e.target.value)} />
                    <TextField label="Descrição" value={form.description} onChange={e => update("description", e.target.value)} />

                    <Stack direction="row" spacing={2}>
                        <TextField select label="Tipo" value={form.type} onChange={e => update("type", e.target.value)} fullWidth>
                            <MenuItem value="ATTACK">Ataque</MenuItem>
                            <MenuItem value="REACT">Reação</MenuItem>
                            <MenuItem value="SKILL">Habilidade</MenuItem>
                            <MenuItem value="SUPPORT">Suporte</MenuItem>
                            <MenuItem value="TEST">Teste</MenuItem>
                        </TextField>

                        <TextField select label="Alvo" value={form.targetType} onChange={e => update("targetType", e.target.value)} fullWidth>
                            <MenuItem value="ENEMY">Inimigo</MenuItem>
                            <MenuItem value="ALLY">Aliado</MenuItem>
                            <MenuItem value="SELF">Em si mesmo</MenuItem>
                        </TextField>
                    </Stack>

                    <Stack direction="row" spacing={2}>
                        <TextField label="Fórmula de Dado" disabled value={form.diceFormula} onChange={e => update("diceFormula", e.target.value)} fullWidth />
                        {form.type === "REACT" || form.type === "ATTACK" || form.type === "SUPPORT" ?
                            <TextField label="Fórmula da ação" value={form.impactFormula} onChange={e => update("impactFormula", e.target.value)} fullWidth />
                            : undefined}
                        <TextField select label="Atributo" value={form.attribute} onChange={e => update("attribute", e.target.value)} fullWidth>
                            <MenuItem value="STRENGTH">Força</MenuItem>
                            <MenuItem value="AGILITY">Agilidade</MenuItem>
                            <MenuItem value="VIGOR">Vigor</MenuItem>
                            <MenuItem value="INTELLECT">Intelecto</MenuItem>
                            <MenuItem value="PRESENCE">Presença</MenuItem>
                        </TextField>
                    </Stack>

                    <Divider />

                    <Stack direction="row" spacing={2}>
                        <TextField label="Modificador" type="number" value={form.modifier} onChange={e => update("modifier", e.target.value)} />
                        <TextField label="Crítico ≥" type="number" value={form.critThreshold} onChange={e => update("critThreshold", e.target.value)} />
                        <TextField label="Multiplicador Crítico" type="number" value={form.critMultiplier} onChange={e => update("critMultiplier", e.target.value)} />
                    </Stack>

                    <Divider />

                    {/* Regras */}
                    <FormControlLabel control={<Switch checked={form.requiresTurn} onChange={e => update("requiresTurn", e.target.checked)} />} label="Consome turno" />
                    <FormControlLabel control={<Switch checked={form.allowOutOfCombat} onChange={e => update("allowOutOfCombat", e.target.checked)} />} label="Pode usar fora de combate" />
                    {/* <FormControlLabel control={<Switch checked={form.appliesEffect} onChange={e => update("appliesEffect", e.target.checked)} />} label="Aplica efeito" /> */}

                    {/* Efeitos
                    {form.appliesEffect && (
                        <>
                            <Divider />
                            <Stack direction="row" spacing={2}>
                                <TextField label="Duração (turnos)" type="number" value={form.durationTurns} onChange={e => update("durationTurns", e.target.value)} />
                                <TextField label="Atributo Afetado" value={form.statAffected} onChange={e => update("statAffected", e.target.value)} />
                                <TextField label="Valor do Efeito" type="number" value={form.effectAmount} onChange={e => update("effectAmount", e.target.value)} />
                            </Stack>

                            <TextField label="Status Aplicado (ex: QUEIMANDO)" value={form.statusApplied} onChange={e => update("statusApplied", e.target.value)} />
                        </>
                    )} */}
                </Stack>
            </DialogContent>

            <DialogActions>
                <Button onClick={() => {
                    setForm({
                        name: "",
                        description: "",
                        type: "ATTACK",
                        targetType: "ENEMY",
                        attribute: "STRENGTH",
                        diceFormula: "1d20",
                        impactFormula: "",
                        modifier: 0,
                        critThreshold: 20,
                        critMultiplier: 2,
                        requiresTurn: true,
                        allowOutOfCombat: false,
                        appliesEffect: false,
                        durationTurns: "",
                        statAffected: "",
                        effectAmount: "",
                        statusApplied: "",
                    })
                    onClose()
                }} color="inherit">Cancelar</Button>
                <Button variant="contained" onClick={handleSave}>Salvar</Button>
            </DialogActions>
        </Dialog>
    );
}
