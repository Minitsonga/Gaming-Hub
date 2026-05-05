import { fireEvent, screen, waitFor } from "@testing-library/react";
import mockRouter from "next-router-mock";
import { renderWithProviders } from "@/test/render-with-providers";
import { resetMockSearchParams } from "@/test/mocks/next-navigation";
import LoginPage from "./page";

describe("LoginPage", () => {
  beforeEach(() => {
    localStorage.clear();
    mockRouter.setCurrentUrl("/login");
    resetMockSearchParams();
    vi.restoreAllMocks();
  });

  it("connecte l utilisateur et redirige vers protected", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          login: {
            token: "t1",
            refreshToken: "r1",
            user: { id: "1", username: "ju", email: "ju@test.com" },
          },
        },
      }),
    } as Response);

    renderWithProviders(<LoginPage />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ju@test.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret12" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit login form" }));

    await waitFor(() => expect(localStorage.getItem("accessToken")).toBe("t1"));
    await waitFor(() => expect(mockRouter.asPath).toBe("/protected"));
  });

  it("affiche une erreur en credentials invalides", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({ errors: [{ message: "Invalid credentials" }] }),
    } as Response);

    renderWithProviders(<LoginPage />);
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ju@test.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "bad" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit login form" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
  });
});
