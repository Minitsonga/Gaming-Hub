import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import mockRouter from "next-router-mock";
import { renderWithProviders } from "@/test/render-with-providers";

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

describe("ProtectedPage", () => {
  beforeEach(() => {
    localStorage.clear();
    mockRouter.setCurrentUrl("/protected");
    vi.restoreAllMocks();
  });

  it("redirige vers login si aucun token", async () => {
    const { default: ProtectedPage } = await import("./page");
    renderWithProviders(<ProtectedPage />);
    await waitFor(() => expect(mockRouter.asPath).toBe("/login"));
  });

  it("nettoie la session et redirige au logout", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ data: { logout: true } }),
    } as Response);

    localStorage.setItem("accessToken", "token");
    localStorage.setItem("refreshToken", "refresh");
    localStorage.setItem("user", JSON.stringify({ username: "ju" }));

    const { default: ProtectedPage } = await import("./page");
    renderWithProviders(<ProtectedPage />);

    fireEvent.click(screen.getByRole("button", { name: "Logout from current session" }));

    await waitFor(() => {
      expect(localStorage.getItem("accessToken")).toBeNull();
      expect(localStorage.getItem("refreshToken")).toBeNull();
      expect(localStorage.getItem("user")).toBeNull();
    });
    expect(mockRouter.asPath.startsWith("/login")).toBe(true);
  });
});
