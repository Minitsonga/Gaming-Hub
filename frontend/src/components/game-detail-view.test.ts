import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { canLaunchGame } from "./game-detail-view";

describe("canLaunchGame", () => {
  it("allows launch for published status", () => {
    assert.equal(canLaunchGame("published"), true);
  });

  it("blocks launch for non-published status", () => {
    assert.equal(canLaunchGame("draft"), false);
  });
});
