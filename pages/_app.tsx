// pages/_app.tsx
import type { AppProps } from "next/app";
import { AuthProvider } from "../context/AuthContext";
import Layout from "./components/Layout";
import { ThemeContextProvider } from "../context/ThemeContext";
import { CssBaseline } from "@mui/material";
import { ToastContainer } from "react-toastify";

export default function MyApp({ Component, pageProps }: AppProps) {

    return (
        <ThemeContextProvider>
            <AuthProvider>
                <Layout>
                    <CssBaseline />
                    <Component {...pageProps} />
                    <ToastContainer position="top-right" autoClose={3000} />
                </Layout>
            </AuthProvider>
        </ThemeContextProvider>
    );
}
