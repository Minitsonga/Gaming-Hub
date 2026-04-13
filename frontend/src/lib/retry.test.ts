import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { withRetry } from "./retry";

describe("withRetry", () => {
  it("retries once before success", async () => {
    let calls = 0;
    const result = await withRetry(async () => {
      calls += 1;
      if (calls < 2) throw new Error("fail");
      return "ok";
    }, 1);
    assert.equal(result, "ok");
    assert.equal(calls, 2);
  });
});
