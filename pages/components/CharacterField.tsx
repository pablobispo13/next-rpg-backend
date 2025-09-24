import { Character } from "@/protected/mesa";
import { TextField } from "@mui/material";

export default function CharacterField({
    label,
    field,
    type = "text",
    value,
    onChange,
    disabled,
}: {
    label: string;
    field: keyof Character;
    type?: string;
    value: string | number;
    onChange: (field: keyof Character, value: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any 
    disabled: boolean;
}) {
    return (
        <TextField
            label={label}
            type={type}
            value={value}
            onChange={(e) => onChange(field, type === "number" ? Number(e.target.value) : e.target.value)}
            disabled={disabled}
            fullWidth
        />
    );
}