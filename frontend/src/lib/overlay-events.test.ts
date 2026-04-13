import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isDecisionOverlayEvent } from "./overlay-events";

describe("overlay event guards", () => {
  it("accepts valid overlay event", () => {
    assert.equal(
      isDecisionOverlayEvent({
        type: "DECISION_OVERLAY",
        payload: { title: "Choose", description: "Pick one", choices: ["A", "B"] },
      }),
      true
    );
  });

  it("rejects malformed event", () => {
    assert.equal(isDecisionOverlayEvent({ type: "OTHER", payload: {} }), false);
  });
});
