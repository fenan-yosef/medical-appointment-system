"use client";
import React, { createContext, useState, useEffect, Dispatch, SetStateAction } from "react";

type ThemeContextType = {
    theme: string;
    setTheme: Dispatch<SetStateAction<string>>;
};

export const ThemeContext = createContext<ThemeContextType>({
    theme: "light",
    setTheme: () => { },
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState("light");

    useEffect(() => {
        const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
        if (stored) setTheme(stored);
        else if (window?.matchMedia("(prefers-color-scheme: dark)").matches) setTheme("dark");
    }, []);

    useEffect(() => {
        if (typeof window !== "undefined") {
            document.body.className = theme;
            localStorage.setItem("theme", theme);
        }
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}