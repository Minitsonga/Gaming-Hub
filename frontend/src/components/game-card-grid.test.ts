import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getCatalogStateLabel } from "./game-card-grid";

describe("getCatalogStateLabel", () => {
  it("returns empty label for zero games", () => {
    assert.equal(getCatalogStateLabel(0), "No games available.");
  });

  it("returns singular label for one game", () => {
    assert.equal(getCatalogStateLabel(1), "1 game available.");
  });

  it("returns plural label for many games", () => {
    assert.equal(getCatalogStateLabel(5), "5 games available.");
  });
});
