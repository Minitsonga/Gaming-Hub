import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateOperatorCatalogForm } from "./operator-catalog-validation";

describe("validateOperatorCatalogForm", () => {
  it("returns required field errors", () => {
    const errors = validateOperatorCatalogForm({
      slug: "",
      title: "",
      description: "short",
      technology: "unity-webgl",
      thumbnailUrl: "",
      tags: "",
    });
    assert.ok(errors.length >= 3);
  });

  it("accepts valid payload", () => {
    const errors = validateOperatorCatalogForm({
      slug: "my-game",
      title: "My Game",
      description: "A valid and long enough description.",
      technology: "unity-webgl",
      thumbnailUrl: "https://example.com/thumb.png",
      tags: "rpg,solo",
    });
    assert.equal(errors.length, 0);
  });
});
