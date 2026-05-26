"use client";

import Link from "next/link";
import { Gamepad2 } from "lucide-react";

import { UserAccountMenu } from "./user-account-menu";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2 text-zinc-200/80 hover:text-zinc-100">
          <Gamepad2 className="size-5 text-sky-200/80" aria-hidden />
          <span className="space-etched text-sm font-semibold tracking-[0.24em]">GAMING HUB</span>
        </Link>
        <div className="flex shrink-0 items-center rounded-full border border-sky-200/10 bg-transparent px-2 py-1 backdrop-blur-[2px]">
          <UserAccountMenu />
        </div>
      </div>
    </header>
  );
}
