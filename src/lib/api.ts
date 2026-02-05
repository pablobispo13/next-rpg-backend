// lib/api.ts
import axios, { AxiosHeaders, InternalAxiosRequestConfig } from "axios";
import { toast } from "react-toastify";

export function handleLogout(reason?: "expired" | "manual") {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  if (reason) localStorage.setItem("logout_reason", reason);
  window.location.href = "/login";
}

const api = axios.create({
  baseURL: "/api",
});

// Interceptor request: adiciona token Bearer automaticamente
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window === "undefined") return config;

  const token = localStorage.getItem("token");

  if (!config.headers) {
    config.headers = new AxiosHeaders();
  } else if (!(config.headers instanceof AxiosHeaders)) {
    config.headers = AxiosHeaders.from(config.headers);
  }

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

// Interceptor response: trata erros globais
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      if (status === 401) {
        handleLogout("expired");
      } else {
        toast.error(data?.message || `Erro: ${status}`);
      }
    } else {
      toast.error("Sem resposta do servidor.");
    }
    return Promise.reject(error);
  }
);

export default api;
