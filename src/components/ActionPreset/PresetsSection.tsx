"use client";

import { Stack, Button } from "@mui/material";
import { useState } from "react";
import { ActionPreset } from "@prisma/client";
import { PresetRow } from "./PresetRow";
import { Section } from "../Section";
import { PresetModal } from "./PresetModal";

type Props = {
    characterId: string;
    presets: ActionPreset[];
    canEdit?: boolean;
};

export function PresetsSection({ characterId, presets, canEdit }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<ActionPreset | null>(null);

    return (
        <>
            <Section
                title="Habilidades"
                action={
                    canEdit && (
                        <Button size="small" onClick={() => setOpen(true)}>
                            + Habilidade
                        </Button>
                    )
                }
            >
                <Stack spacing={1}>
                    {presets.map(preset => (
                        <PresetRow
                            key={preset.id}
                            preset={preset}
                            canEdit={canEdit}
                            onEdit={() => {
                                setEditing(preset);
                                setOpen(true);
                            }}
                        />
                    ))}
                </Stack>
            </Section>

            <PresetModal
                open={open}
                characterId={characterId}
                // preset={editing}
                onClose={() => {
                    setOpen(false);
                    setEditing(null);
                }}
            />
        </>
    );
}
