import {
    ThemeProvider,
    createTheme,
    useMediaQuery,
} from "@mui/material";
import React, {
    createContext,
    ReactElement,
    useEffect,
    useState,
} from "react";

type ThemeType = "light" | "dark";

interface ThemeContextInterface {
    mode: ThemeType;
    toggleColorMode: () => void;
}

export const ThemeContext = createContext<ThemeContextInterface>({
    mode: "dark",
    toggleColorMode: () => { },
});

interface ThemeContextProviderInterface {
    children: ReactElement | null;
}

export const ThemeContextProvider: React.FC<ThemeContextProviderInterface> = ({
    children,
}) => {
    // Estado inicial FIXO → SSR e client começam iguais
    const [mode, setMode] = useState<ThemeType>("dark");

    // Só roda no client
    const prefersDarkMode = useMediaQuery(
        "(prefers-color-scheme: dark)",
        { noSsr: true }
    );

    // Hidratação segura
    useEffect(() => {
        const storedTheme = localStorage.getItem("theme");

        if (storedTheme === "light" || storedTheme === "dark") {
            setMode(storedTheme);
        } else {
            setMode(prefersDarkMode ? "dark" : "light");
        }
    }, [prefersDarkMode]);

    useEffect(() => {
        localStorage.setItem("theme", mode);
    }, [mode]);

    const toggleColorMode = () => {
        setMode((prev) => (prev === "light" ? "dark" : "light"));
    };

    const scrollbarColor = mode === "dark" ? "#536480" : "#042e39";

    const theme = createTheme({
        palette: { mode },
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    body: {
                        ".MuiTypography-root": {
                            fontFamily: "'Rubik', sans-serif !important",
                        },
                        ".MuiAppBar-root": {
                            // individual components override this via sx
                            background: "transparent",
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
        <ThemeContext.Provider value={{ mode, toggleColorMode }}>
            <ThemeProvider theme={theme}>{children}</ThemeProvider>
        </ThemeContext.Provider>
    );
};
