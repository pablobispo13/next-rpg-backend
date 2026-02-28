import api from "./api";

type Attribute =
    | "STRENGTH"
    | "AGILITY"
    | "VIGOR"
    | "INTELLECT"
    | "PRESENCE";

const attributeLabels: Record<Attribute, string> = {
    STRENGTH: "Força",
    AGILITY: "Agilidade",
    VIGOR: "Vigor",
    INTELLECT: "Intelecto",
    PRESENCE: "Presença",
};

type ActionType = "TEST" | "REACT";
type TargetType = "SELF" | "ENEMY";

type RolagemBase = {
    name: string;
    description: string;
    type: ActionType;
    targetType: TargetType;
    diceFormula: "1d20";
    impactFormula?: string;
    modifier: 0;
    critThreshold: number | null;
    critMultiplier: number | null;
    requiresTurn: false;
    allowOutOfCombat: true;
    appliesEffect: boolean;
    attribute: Attribute;
    durationTurns: null;
    statAffected: null;
    effectAmount: null;
    statusApplied: null;
    characterId: string;
};

export function createAttributeTest(
    characterId: string,
    attribute: Attribute
): RolagemBase {
    const label = attributeLabels[attribute];

    return {
        name: `Teste ${label}`,
        description: `Teste ${label}`,
        type: "TEST",
        targetType: "SELF",
        diceFormula: "1d20",
        modifier: 0,
        critThreshold: 20,
        critMultiplier: 0,
        requiresTurn: false,
        allowOutOfCombat: true,
        appliesEffect: false,
        attribute,
        durationTurns: null,
        statAffected: null,
        effectAmount: null,
        statusApplied: null,
        characterId,
    };
}

export function createAllAttributeTests(characterId: string): RolagemBase[] {
    return (Object.keys(attributeLabels) as Attribute[]).map(attribute =>
        createAttributeTest(characterId, attribute)
    );
}
export function createDodge(
    characterId: string,
    attribute: Attribute = "AGILITY"
): RolagemBase {
    return {
        name: "Esquiva",
        description: "Permite tentar esquivar de um ataque",
        type: "REACT",
        targetType: "SELF",
        diceFormula: "1d20",
        modifier: 0,
        critThreshold: null,
        critMultiplier: null,
        requiresTurn: false,
        allowOutOfCombat: true,
        appliesEffect: false,
        attribute,
        durationTurns: null,
        statAffected: null,
        effectAmount: null,
        statusApplied: null,
        characterId,
    };
}
export function createBlock(
    characterId: string,
    attribute: Attribute = "VIGOR"
): RolagemBase {
    return {
        name: "Bloqueio",
        description: "Permite tentar bloquear de um ataque",
        type: "REACT",
        targetType: "SELF",
        diceFormula: "1d20",
        modifier: 0,
        critThreshold: null,
        critMultiplier: null,
        requiresTurn: false,
        allowOutOfCombat: true,
        appliesEffect: false,
        attribute,
        durationTurns: null,
        statAffected: null,
        effectAmount: null,
        statusApplied: null,
        characterId,
    };
}
export function createCounterAttack(
    characterId: string,
    attribute: Attribute = "STRENGTH"
): RolagemBase {
    return {
        name: "Contra-Ataque",
        description: "Rebate ataques inimigos",
        type: "REACT",
        targetType: "ENEMY",
        diceFormula: "1d20",
        impactFormula: "1d6",
        modifier: 0,
        critThreshold: 20,
        critMultiplier: 2,
        requiresTurn: false,
        allowOutOfCombat: true,
        appliesEffect: true,
        attribute,
        durationTurns: null,
        statAffected: null,
        effectAmount: null,
        statusApplied: null,
        characterId,
    };
}

export async function createCharacterTemplate(): Promise<any> {/* eslint-disable  @typescript-eslint/no-explicit-any */
    const result = await api.post("/characters", {
        "name": "Personagem de template",
        "life": 20,
        "maxLife": 20,
        "xp": 0,
        "baseDefense": 0,
        "strength": 0,
        "agility": 0,
        "vigor": 0,
        "intellect": 0,
        "presence": 0
    }
    );
    const characterId = result.data.id

    let counterAttackId, dodgeId, blockId: string = "";
    const allActionPresets = [...createAllAttributeTests(characterId), createCounterAttack(characterId), createDodge(characterId), createBlock(characterId)]
    for (const actionPreset of allActionPresets) {
        const result = await api.post("/actionPreset", actionPreset);
        if (result.data.name === "Esquiva") {
            dodgeId = result.data.id
        } else if (result.data.name === "Contra-Ataque") {
            counterAttackId = result.data.id
        }
        else if (result.data.name === "Bloqueio") {
            blockId = result.data.id
        }
    }
    if (counterAttackId && dodgeId && blockId)
        await api.put(`/characters/${characterId}`, {
            "name": "Personagem de template",
            "life": 20,
            "maxLife": 20,
            "xp": 0,
            "strength": 0,
            "agility": 0,
            "vigor": 0,
            "intellect": 0,
            "presence": 0,
            dodgePresetId: dodgeId,
            counterAttackPresetId: counterAttackId,
            blockPresetId: blockId
        }
        );
    return result;
}