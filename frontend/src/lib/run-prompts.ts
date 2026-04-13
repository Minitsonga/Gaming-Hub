export type RunState = "idle" | "running" | "paused" | "game-over";

export function getRunPrompt(state: RunState): string {
  switch (state) {
    case "idle":
      return "Press start in the game to begin.";
    case "running":
      return "Stay focused and adapt your build.";
    case "paused":
      return "Game paused. Resume when ready.";
    case "game-over":
      return "Run ended. Restart to try again.";
    default:
      return "";
  }
}
