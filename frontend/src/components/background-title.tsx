"use client";

import { usePathname } from "next/navigation";

const TITLE_VISIBLE_ROUTES = ["/", "/login", "/register"];

export function BackgroundTitle() {
  const pathname = usePathname();
  const showTitle = TITLE_VISIBLE_ROUTES.some((route) => pathname === route);

  if (!showTitle) return null;

  return (
    <div className="pointer-events-none fixed left-1/2 top-18 z-0 hidden -translate-x-1/2 select-none md:block">
      <p className="space-title text-center text-7xl font-black tracking-[0.28em] xl:text-8xl">GAMING HUB</p>
    </div>
  );
}

