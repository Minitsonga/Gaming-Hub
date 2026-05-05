"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type Language = "en" | "fr";
export type Theme = "core";
export type ColorMode = "light" | "dark";

type PreferencesContextValue = {
  language: Language;
  mode: ColorMode;
  theme: Theme;
  setLanguage: (language: Language) => void;
  setMode: (mode: ColorMode) => void;
  setTheme: (theme: Theme) => void;
  toggleMode: () => void;
  t: (en: string, fr: string) => string;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

function readStoredMode(): ColorMode {
  if (typeof window === "undefined") return "dark";
  const saved = localStorage.getItem("mode");
  if (saved === "dark" || saved === "light") return saved;
  return "dark";
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "core";
  const saved = localStorage.getItem("theme");
  if (saved === "core") return saved;
  return "core";
}

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    const savedLanguage = localStorage.getItem("language");
    return savedLanguage === "fr" ? "fr" : "en";
  });
  const [mode, setMode] = useState<ColorMode>(() => readStoredMode());
  const [theme, setTheme] = useState<Theme>(() => readStoredTheme());

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language === "fr" ? "fr" : "en";
  }, [language]);

  useEffect(() => {
    localStorage.setItem("mode", mode);
    document.documentElement.dataset.theme = mode;
    document.documentElement.classList.toggle("dark", mode === "dark");
  }, [mode]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
  }, [theme]);

  const value = useMemo<PreferencesContextValue>(
    () => ({
      language,
      mode,
      theme,
      setLanguage,
      setMode,
      setTheme,
      toggleMode: () => setMode((previous) => (previous === "dark" ? "light" : "dark")),
      t: (en, fr) => (language === "fr" ? fr : en),
    }),
    [language, mode, theme]
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function useAppPreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("useAppPreferences must be used inside AppPreferencesProvider");
  }
  return context;
}
