import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

const graphqlRequestMock = vi.fn();

vi.mock("@/lib/graphql", () => ({
  graphqlRequest: (...args: unknown[]) => graphqlRequestMock(...args),
}));

describe("GameSessionClient", () => {
  beforeEach(() => {
    graphqlRequestMock.mockReset();
    localStorage.clear();
    localStorage.setItem("accessToken", "token");
  });

  it("affiche overlay, gere restart et traite run ended", async () => {
    const { GameSessionClient } = await import("./game-session-client");
    graphqlRequestMock
      .mockResolvedValueOnce({ restoreProgression: { payload: "save-a" } })
      .mockResolvedValueOnce({
        leaderboard: [{ rank: 1, user: "ju", score: 120 }],
      })
      .mockResolvedValueOnce({ saveProgression: { id: "s1" } })
      .mockResolvedValueOnce({ submitScore: { id: "sc1" } })
      .mockResolvedValueOnce({
        leaderboard: [{ rank: 1, user: "ju", score: 130 }],
      });

    const postMessageSpy = vi.spyOn(window, "postMessage");

    render(<GameSessionClient gameId="g-1" gameTitle="Game A" launchUrl="http://localhost/game" />);

    await waitFor(() => expect(screen.getByText("Previous progression restored.")).toBeTruthy());

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: {
            type: "DECISION_OVERLAY",
            title: "Choose a card",
            choices: [{ id: "c1", label: "Pick", primary: true }],
          },
        })
      );
    });
    await waitFor(() => expect(screen.getByText("Choose a card")).toBeTruthy());
    fireEvent.click(screen.getByRole("button", { name: "Pick" }));
    expect(postMessageSpy).toHaveBeenCalled();

    await act(async () => {
      window.dispatchEvent(
        new MessageEvent("message", {
          data: { type: "RUN_ENDED", score: 130, savePayload: "save-b" },
        })
      );
    });

    await waitFor(() => expect(screen.getByText("Progression saved.")).toBeTruthy());
    await waitFor(() => expect(screen.getByText("Score submitted.")).toBeTruthy());
  });
});
