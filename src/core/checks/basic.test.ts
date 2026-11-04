import { expect, test } from "vitest";
import type { Case } from "../domain/schemas";
import { basicChecks } from "./basic";

const c: Case = { id: "c001", category: "api_fact", question: "q?", context_slice_ids: ["stripe:refunds.create", "stripe:refund.status"], critical: true, expected: { must_refuse: false, must_cite: ["stripe:refunds.create"] }, provenance: { drafted_by: "d" } };
const ans = (over: object = {}) => ({ code: "ok" as const, output: { answer: "No.", cited_source_ids: ["stripe:refunds.create"], refused: false, refusal_reason: null, ...over } });
const codes = (r: ReturnType<typeof basicChecks>) => r.failures.map((f) => f.code);

test("a correct answer has no failures", () => {
  expect(basicChecks(c, ans())).toEqual({ evaluated: true, failures: [] });
});

test("wrong refusal, citations outside the context and missing citations are caught", () => {
  expect(codes(basicChecks(c, ans({ refused: true, refusal_reason: "x" })))).toEqual(["semantic_wrong_refusal"]);
  expect(codes(basicChecks(c, ans({ cited_source_ids: ["stripe:refunds.create", "ns:NS-R1"] })))).toEqual(["semantic_cites_outside_context"]);
  expect(codes(basicChecks(c, ans({ cited_source_ids: ["stripe:refund.status"] })))).toEqual(["semantic_missing_citation"]);
});

test("a malformed output is not evaluated and never semantic-passes", () => {
  expect(basicChecks(c, { code: "schema_invalid", detail: "not JSON" })).toEqual({ evaluated: false, failures: [{ code: "schema_invalid", detail: "not JSON" }] });
});
