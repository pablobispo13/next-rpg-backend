"use client";

import { Stack, Button } from "@mui/material";
import { useState } from "react";
import { InventoryItemRow } from "./InventoryItemRow";
import { InventoryItemModal } from "./InventoryItemModal";
import { Section } from "../Section";
import { CharacterInventory } from "../../types/types";

type Props = {
    characterId: string;
    items: CharacterInventory[];
    canEdit?: boolean;
};

export function InventorySection({ characterId, items, canEdit }: Props) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<CharacterInventory | undefined>(undefined);

    return (
        <>
            <Section
                title="Inventário"
                action={
                    canEdit && (
                        <Button size="small" onClick={() => setOpen(true)}>
                            + Item
                        </Button>
                    )
                }
            >
                <Stack spacing={1}>
                    {items.map(item => (
                        <InventoryItemRow
                            key={item.id}
                            item={item}
                            canEdit={canEdit}
                            onEdit={() => {
                                setEditing(item);
                                setOpen(true);
                            }}
                        />
                    ))}
                </Stack>
            </Section>

            <InventoryItemModal
                open={open}
                characterId={characterId}
                item={editing}
                onClose={() => {
                    setOpen(false);
                    setEditing(undefined);
                }}
            />
        </>
    );
}
