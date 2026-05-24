import * as yup from "yup";

export type CampaignForm = {
  name: string;
  description?: string | null;
};

export const campaignSchema: yup.ObjectSchema<CampaignForm> = yup.object({
  name: yup
    .string()
    .trim()
    .required("O nome da mesa é obrigatório")
    .min(2, "Nome muito curto")
    .max(60, "Máximo 60 caracteres"),
  description: yup
    .string()
    .trim()
    .max(500, "Máximo 500 caracteres")
    .optional()
    .nullable()
    .transform((v) => (v === "" ? null : v)),
});

export type JoinForm = {
  code: string;
};

export const joinSchema: yup.ObjectSchema<JoinForm> = yup.object({
  code: yup
    .string()
    .trim()
    .uppercase()
    .required("Código obrigatório")
    .length(6, "Código deve ter 6 caracteres"),
});
