import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getRunPrompt } from "./run-prompts";

describe("getRunPrompt", () => {
  it("returns game-over prompt", () => {
    assert.equal(getRunPrompt("game-over"), "Run ended. Restart to try again.");
  });
});
