import { useContext } from "react";
import type { AppProps } from "next/app";
import { CssBaseline } from "@mui/material";
import { ToastContainer } from "react-toastify";
import { ThemeContext, ThemeContextProvider } from "../context/ThemeContext";
import { AuthProvider } from "../context/AuthContext";
import { CampaignProvider } from "../context/CampaignContext";
import Layout from "../components/Layout";

export default function MyApp({ Component, pageProps }: AppProps) {
    const { mode } = useContext(ThemeContext);


    return (
        <ThemeContextProvider>
            <AuthProvider>
                <CampaignProvider>
                    <Layout>
                        <CssBaseline />
                        <Component {...pageProps} />
                        <ToastContainer
                            theme={mode}
                            position="top-right"
                            autoClose={6000}
                        />
                    </Layout>
                </CampaignProvider>
            </AuthProvider>
        </ThemeContextProvider>
    );
}
