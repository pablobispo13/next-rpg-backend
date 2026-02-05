import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { loginSchema, registerSchema, LoginForm, RegisterForm } from "../validation/auth";

export function useLoginForm() {
  return useForm<LoginForm>({
    defaultValues: { email: "", password: "" },
    resolver: yupResolver(loginSchema),
  });
}

export function useRegisterForm() {
  return useForm<RegisterForm>({
    defaultValues: { username: "", email: "", password: "" },
    resolver: yupResolver(registerSchema),
  });
}
