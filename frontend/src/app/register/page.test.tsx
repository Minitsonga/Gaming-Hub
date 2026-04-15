import { fireEvent, screen, waitFor } from "@testing-library/react";
import { renderWithProviders } from "@/test/render-with-providers";
import RegisterPage from "./page";

describe("RegisterPage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("cree un compte et stocke la session", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          register: {
            token: "t1",
            refreshToken: "r1",
            user: { id: "1", username: "ju", email: "ju@test.com" },
          },
        },
      }),
    } as Response);

    renderWithProviders(<RegisterPage />);
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "jus" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ju@test.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret12" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit registration form" }));

    await waitFor(() => expect(localStorage.getItem("accessToken")).toBe("t1"));
    expect(screen.getByText("Account created successfully.")).toBeTruthy();
  });

  it("affiche une erreur globale en cas d echec", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue({
      ok: false,
      json: async () => ({ errors: [{ message: "Registration failed" }] }),
    } as Response);

    renderWithProviders(<RegisterPage />);
    fireEvent.change(screen.getByLabelText("Username"), { target: { value: "jus" } });
    fireEvent.change(screen.getByLabelText("Email"), { target: { value: "ju@test.com" } });
    fireEvent.change(screen.getByLabelText("Password"), { target: { value: "secret12" } });
    fireEvent.click(screen.getByRole("button", { name: "Submit registration form" }));

    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
  });
});
