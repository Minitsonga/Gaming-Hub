"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

type Language = "en" | "fr";
type Theme = "light" | "dark";

type PreferencesContextValue = {
  language: Language;
  theme: Theme;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  translate: (englishText: string, frenchText: string) => string;
  t: (englishText: string, frenchText: string) => string;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function AppPreferencesProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window === "undefined") return "en";
    const savedLanguage = localStorage.getItem("language");
    return savedLanguage === "fr" ? "fr" : "en";
  });
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const value = useMemo<PreferencesContextValue>(() => {
    const translate = (englishText: string, frenchText: string) =>
      language === "fr" ? frenchText : englishText;
    return {
      language,
      theme,
      setLanguage,
      setTheme,
      translate,
      t: translate,
    };
  }, [language, theme]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function useAppPreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("useAppPreferences must be used inside AppPreferencesProvider");
  }
  return context;
}
