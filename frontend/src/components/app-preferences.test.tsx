import { fireEvent, render, screen } from "@testing-library/react";
import { AppPreferencesProvider } from "./app-preferences";
import { PreferencesBar } from "./preferences-bar";

describe("AppPreferencesProvider", () => {
  it("applique et persiste la langue et le theme", () => {
    render(
      <AppPreferencesProvider>
        <PreferencesBar />
      </AppPreferencesProvider>
    );

    const languageSelect = screen.getByLabelText("Language");
    fireEvent.change(languageSelect, { target: { value: "fr" } });
    expect(localStorage.getItem("language")).toBe("fr");

    const themeButton = screen.getByRole("button", { name: "Changer le theme" });
    fireEvent.click(themeButton);

    expect(localStorage.getItem("theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });
});
