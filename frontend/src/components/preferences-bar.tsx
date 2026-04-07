"use client";

import { useAppPreferences } from "./app-preferences";

export function PreferencesBar() {
  const { language, theme, setLanguage, setTheme, t } = useAppPreferences();

  return (
    <div className="flex w-full items-center justify-end gap-2 border-b p-3">
      <select
        className="rounded border px-2 py-1"
        value={language}
        onChange={(event) => setLanguage(event.target.value as "en" | "fr")}
        aria-label={t("Language", "Langue")}
      >
        <option value="en">EN</option>
        <option value="fr">FR</option>
      </select>

      <button
        type="button"
        className="rounded border px-3 py-1"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      >
        {theme === "dark" ? t("Light", "Clair") : t("Dark", "Sombre")}
      </button>
    </div>
  );
}
