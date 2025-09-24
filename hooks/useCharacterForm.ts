import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { characterSchema, EditableCharacter } from "../validation/character";

export function useCharacterForm(defaultValues: EditableCharacter) {
    return useForm<EditableCharacter>({
        defaultValues,
        resolver: yupResolver(characterSchema),
    });
}
