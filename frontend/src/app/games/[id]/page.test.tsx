import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { resetMockNavigationParams, setMockNavigationParams } from "@/test/mocks/next-navigation";
import GameDetailPage from "./page";

const fetchGameById = vi.fn();

vi.mock("../../../lib/game-client", () => ({
  fetchGameById: (...args: unknown[]) => fetchGameById(...args),
}));

const publishedGame = {
  id: "g1",
  slug: "g1",
  title: "Game One",
  description: "desc",
  thumbnailUrl: "https://example.com/t.png",
  technology: "Unity",
  status: "published",
  tags: ["a"],
};

describe("GameDetailPage", () => {
  beforeEach(() => {
    resetMockNavigationParams();
    fetchGameById.mockReset();
  });

  it("affiche les metadonnees et le bouton de lancement", async () => {
    setMockNavigationParams({ id: "g1" });
    fetchGameById.mockResolvedValue(publishedGame);

    render(<GameDetailPage />);

    await waitFor(() => {
      expect(screen.getByText("Game One")).toBeTruthy();
    });
    expect(screen.getByRole("button", { name: "Launch game" })).toBeTruthy();
  });

  it("affiche un etat not found", async () => {
    setMockNavigationParams({ id: "404" });
    fetchGameById.mockResolvedValue(null);

    render(<GameDetailPage />);

    await waitFor(() => {
      expect(screen.getByText(/Game not found\./)).toBeTruthy();
    });
  });
});
