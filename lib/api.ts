import axios from "axios";
import { toast } from "react-toastify";

export function handleLogout(reason?: "expired" | "manual") {
  if (typeof window === "undefined") return;
  localStorage.removeItem("token");
  if (reason) {
    localStorage.setItem("logout_reason", reason);
  }
  window.location.href = "/login";
}

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = "Ocorreu um erro inesperado.";

    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          message = data?.message || "Requisição inválida.";
          break;
        case 401: {
          const isAuthRoute =
            error.config?.url?.includes("/auth/login") ||
            error.config?.url?.includes("/auth/register");

          if (!isAuthRoute) {
            handleLogout("expired");
          }

          return Promise.reject(error);
        }
        case 403:
          message = "Você não tem permissão para executar essa ação.";
          break;
        case 404:
          message = "Recurso não encontrado.";
          break;
        case 500:
          message = "Erro interno no servidor.";
          break;
        default:
          message = data?.message || `Erro: ${status}`;
      }
    } else if (error.request) {
      message = "Sem resposta do servidor. Verifique sua conexão.";
    } else {
      message = error.message;
    }

    toast.error(message);
    return Promise.reject(error);
  }
);

export default api;
