import { expect, test } from "vitest";
import { scoreOutput } from "./output";

const raw = (raw_text: string | null, finish_reason: string | null = "stop", refusal: string | null = null) => ({ raw_text, finish_reason, refusal });
const good = JSON.stringify({ answer: "No.", cited_source_ids: ["stripe:refunds.create"], refused: false, refusal_reason: null });

test("valid JSON in the answer schema is ok", () => {
  expect(scoreOutput(raw(good))).toEqual({ code: "ok", output: JSON.parse(good) });
});

test("each failure gets its own code", () => {
  expect(scoreOutput(raw('{"answer": "unterminated')).code).toBe("schema_invalid");
  expect(scoreOutput(raw('{"answer": "x"}'))).toMatchObject({ code: "schema_invalid", detail: expect.stringContaining("cited_source_ids") });
  expect(scoreOutput(raw('{"answer": "cut', "length")).code).toBe("schema_truncated");
  expect(scoreOutput(raw(null, "stop", "I can't help"))).toEqual({ code: "model_refusal", detail: "I can't help" });
  expect(scoreOutput(raw(null)).code).toBe("schema_invalid");
});

test("well-formed JSON with a wrong type is still schema_invalid", () => {
  expect(scoreOutput(raw(JSON.stringify({ answer: "x", cited_source_ids: "stripe:refunds.create", refused: false, refusal_reason: null }))).code).toBe("schema_invalid");
});
