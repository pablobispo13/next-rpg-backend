import { ThemeProvider, createTheme, useMediaQuery } from "@mui/material";
import React, { createContext, ReactElement, useEffect, useState } from "react";

interface ThemeContextInterface {
    toggleColorMode: () => void;
}

export const ThemeContext = createContext<ThemeContextInterface>({
    toggleColorMode: () => { },
});

type ThemeType = "light" | "dark";

interface ThemeContextProviderInterface {
    children: ReactElement<ReactElement> | null;
}

export const ThemeContextProvider: React.FC<ThemeContextProviderInterface> = ({
    children,
}) => {
    const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
    const getTheme = () => {
        const theme = typeof window !== "undefined" ? localStorage.getItem("theme") : "dark";
        return theme === "light" || theme === "dark"
            ? theme
            : prefersDarkMode
                ? "dark"
                : "light";
    };

    const [mode, setMode] = useState<ThemeType>(getTheme());

    useEffect(() => {
        localStorage.setItem("theme", mode);
    }, [mode]);

    const toggleColorMode = () =>
        setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));

    const scrollbarColor = mode === "dark" ? "#536480" : "#042e39";

    const theme = createTheme({
        palette: {
            mode,
        },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        ".MuiTypography-root": {
                            fontFamily: "'Rubik', sans-serif !important",
                        },
                        ".MuiAppBar-root": {
                            background: mode === "dark" ? "#4c5d77e3" : "#06222fd1"
                        },
                        ".MuiMenuItem-root": {
                            borderRadius: "20px",
                        },
                        "*::-webkit-scrollbar-track": {
                            background: "transparent",
                        },
                        "*::-webkit-scrollbar-thumb": {
                            backgroundColor: scrollbarColor,
                            borderRadius: "12px",
                        },
                        "*::-webkit-scrollbar": {
                            width: "12px",
                        },

                    },
                },
            },
        },
    });

    return (
        <ThemeContext.Provider value={{ toggleColorMode }}>
            <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </ThemeContext.Provider>
    );
};