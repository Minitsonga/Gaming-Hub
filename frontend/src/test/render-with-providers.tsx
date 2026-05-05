import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { AppPreferencesProvider } from "@/components/app-preferences";

function AllProviders({ children }: { children: ReactNode }) {
  return <AppPreferencesProvider>{children}</AppPreferencesProvider>;
}

export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  return render(ui, { wrapper: AllProviders, ...options });
}
