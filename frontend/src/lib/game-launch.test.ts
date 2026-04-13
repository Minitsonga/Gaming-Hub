import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildLaunchUrl, isLaunchableStatus } from "./game-launch";

describe("game launch utilities", () => {
  it("builds launch url from base and slug", () => {
    assert.equal(buildLaunchUrl("https://games.example.com", "rogue-run"), "https://games.example.com/rogue-run");
  });

  it("recognizes launchable status", () => {
    assert.equal(isLaunchableStatus("published"), true);
    assert.equal(isLaunchableStatus("draft"), false);
  });
});
