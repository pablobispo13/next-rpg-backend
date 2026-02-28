export type Character = {
    // Identidade
    id: string;
    name: string;
    baseDefense: number
    // Controle
    owner?: CharacterOwner;

    // Recursos
    life: number;
    maxLife: number;
    xp: number;

    // Atributos base
    strength: number;
    agility: number;
    vigor: number;
    intellect: number;
    presence: number;

    // Sistemas
    inventory: CharacterInventory[];
    presets: ActionPresetType[];
    statusEffects: CharacterStatusEffect[];

    // Histórico
    actionLogs: ActionLog[]
};
export type Log = {
    id: string;
    name: string;
    message: string
};

export type OwnerRole = "MESTRE" | "JOGADOR";
export type CharacterOwner = {
    username: string;
    role: OwnerRole;
};
export type CharacterInventory = {
    id: string;
    name: string;
    quantity: number;
    preset?: ActionPresetType | null;
};

export type ActionPresetType = {
    id: string;
    name: string;
    description?: string | null;
    type: string;
    targetType: string;
    diceFormula: string;
    impactFormula: string
    modifier: number;
    attribute: string;
    critThreshold?: number | null;
    critMultiplier?: number | null;
    requiresTurn?: boolean;
    allowOutOfCombat?: boolean;
    appliesEffect?: boolean;
    durationTurns?: number | null;
    statAffected?: string | null;
    effectAmount?: number | null;
    statusApplied?: string | null;
    effects: CharacterStatusEffect[]
};

export type CharacterStatusEffect = {
    id: string;
    type: string;
    remainingTurns: number;
};
export type Roll = {
    id: string;
    type: string;
    total: number
    modifier: number
    rolls: number[]
    damage: number
    sucess: boolean
    diceRolled?: string;
    createdAt?: string;
    preset: ActionPresetType
    reactionType?: "DODGE" | "COUNTER_ATTACK" | "BLOCK"

};
export type ActionLog = {
    id: string;
    type: string;
    message: string
    roll?: Roll
};
export const Character_Attributes = [
    { key: "strength", label: "Força" },
    { key: "agility", label: "Agilidade" },
    { key: "vigor", label: "Vigor" },
    { key: "intellect", label: "Intelecto" },
    { key: "presence", label: "Presença" },
] as const;

export const getLifePercent = (life: number, maxLife: number) =>
    Math.max(0, Math.min(100, (life / maxLife) * 100));
