import * as yup from "yup";
import { Character } from "../types/types";

export type EditableCharacter = Omit<Character, "id" | "ownerId" | "owner">;

export const characterSchema: yup.ObjectSchema<any> = yup.object({
    name: yup.string().required("O nome é obrigatório"),
    life: yup.number().required("Life é obrigatório").min(0),
    xp: yup.number().required("XP é obrigatório").min(0),
    agility: yup.number().required("Agility é obrigatório").min(0),
    strength: yup.number().required("Strength é obrigatório").min(0),
    vigor: yup.number().required("Vigor é obrigatório").min(0),
    presence: yup.number().required("Presence é obrigatório").min(0),
    intellect: yup.number().required("Intellect é obrigatório").min(0),
});
