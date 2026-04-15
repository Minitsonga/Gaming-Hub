import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

const graphqlRequestMock = vi.fn();

vi.mock("next/link", () => ({
  default: ({ children, href }: { children: ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/graphql", () => ({
  graphqlRequest: (...args: unknown[]) => graphqlRequestMock(...args),
}));

const games = Array.from({ length: 7 }).map((_, index) => ({
  id: `${index + 1}`,
  slug: `game-${index + 1}`,
  title: index === 0 ? "Alpha Quest" : `Game ${index + 1}`,
  description: index === 0 ? "best roguelike adventure" : "description",
  thumbnailUrl: "",
  technology: index % 2 === 0 ? "Unity" : "WebGL",
  status: index % 2 === 0 ? "published" : "draft",
  tags: ["tag"],
}));

describe("GamesPage", () => {
  beforeEach(() => {
    graphqlRequestMock.mockReset();
    graphqlRequestMock.mockResolvedValue({ games });
  });

  it("affiche le catalogue avec pagination et liens de lancement", async () => {
    const { default: GamesPage } = await import("./page");
    render(<GamesPage />);

    await waitFor(() => expect(screen.getByText("Alpha Quest")).toBeTruthy());
    expect(screen.getByText("Page 1 / 2")).toBeTruthy();
    expect(screen.getAllByText("Launch session").length).toBeGreaterThan(0);
  });

  it("filtre le catalogue via la recherche", async () => {
    const { default: GamesPage } = await import("./page");
    render(<GamesPage />);
    await waitFor(() => expect(screen.getByText("Alpha Quest")).toBeTruthy());

    fireEvent.change(screen.getByPlaceholderText("Search game"), {
      target: { value: "alpha" },
    });

    expect(screen.getByText("Alpha Quest")).toBeTruthy();
    expect(screen.queryByText("Game 2")).toBeNull();
  });

  it("execute la creation operateur avec token", async () => {
    localStorage.setItem("accessToken", "token-operator");
    const { default: GamesPage } = await import("./page");
    graphqlRequestMock
      .mockResolvedValueOnce({ games })
      .mockResolvedValueOnce({
        createGame: {
          id: "999",
          slug: "new-game",
          title: "New game",
          description: "new desc",
          thumbnailUrl: "",
          technology: "Unity",
          status: "draft",
          tags: ["new"],
        },
      });

    render(<GamesPage />);
    await waitFor(() => expect(screen.getByText("Alpha Quest")).toBeTruthy());

    fireEvent.change(screen.getByPlaceholderText("New game title"), { target: { value: "New game" } });
    fireEvent.change(screen.getByPlaceholderText("New game slug"), { target: { value: "new-game" } });
    fireEvent.change(screen.getByPlaceholderText("New game description"), { target: { value: "new desc" } });
    fireEvent.click(screen.getByRole("button", { name: "Create game" }));

    await waitFor(() => expect(screen.getByText("Game created.")).toBeTruthy());
    expect(graphqlRequestMock).toHaveBeenLastCalledWith(
      expect.stringContaining("mutation CreateGame"),
      expect.any(Object),
      { token: "token-operator" }
    );
  });
});
