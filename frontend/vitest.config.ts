import path from "node:path";
import { configDefaults, defineConfig } from "vitest/config";

const NODE_NATIVE_TEST_GLOBS = [
  "**/game-card-grid.test.ts",
  "**/game-detail-view.test.ts",
  "**/catalog-view-model.test.ts",
  "**/game-launch.test.ts",
  "**/operator-catalog-validation.test.ts",
  "**/overlay-events.test.ts",
  "**/retry.test.ts",
  "**/run-prompts.test.ts",
] as const;

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "next/navigation": path.resolve(__dirname, "./src/test/mocks/next-navigation.ts"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    exclude: [...configDefaults.exclude, ...NODE_NATIVE_TEST_GLOBS],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
    },
  },
});
