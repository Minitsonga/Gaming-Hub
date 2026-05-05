"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Gamepad2 } from "lucide-react";
import { useAppPreferences } from "./app-preferences";
import { buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function AppHeader() {
  const { language, setLanguage, t } = useAppPreferences();
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    setHasToken(Boolean(localStorage.getItem("accessToken")));
  }, []);

  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-200/80 hover:text-zinc-100">
          <Gamepad2 className="size-5 text-sky-200/80" aria-hidden />
          <span className="space-etched text-sm font-semibold tracking-[0.24em]">GAMING HUB</span>
        </Link>
        <div className="flex shrink-0 items-center gap-2 rounded-full border border-sky-200/10 bg-transparent px-2 py-1 backdrop-blur-[2px]">
          <Link
            href={hasToken ? "/protected" : "/login"}
            className={cn(
              buttonVariants({ variant: "outline", size: "sm" }),
              "border-sky-200/20 bg-black/15 text-zinc-100 hover:bg-sky-500/15"
            )}
          >
            {hasToken ? t("Profile", "Profil") : t("Sign in", "Connexion")}
          </Link>
          <Select
            value={language.toUpperCase()}
            onValueChange={(v) => {
              if (v === "EN" || v === "FR") setLanguage(v.toLowerCase() as "en" | "fr");
            }}
          >
            <SelectTrigger
              size="sm"
              className="w-[4.5rem] border-sky-200/20 bg-black/15 text-zinc-100 hover:bg-sky-500/15"
              aria-label={t("Language", "Langue")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="EN">EN</SelectItem>
              <SelectItem value="FR">FR</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </header>
  );
}
