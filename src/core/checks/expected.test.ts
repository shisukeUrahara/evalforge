import { expect, test } from "vitest";
import { loadPolicy } from "../context/northstar";
import type { Case } from "../domain/schemas";
import { expectedChecks, normalizeNumbers, valuePattern } from "./expected";

const rules = new Map(loadPolicy("fixtures/northstar/policy_v1.md").map((r) => [r.id, r]));
const c = (rule: string, over: Partial<Case["expected"]> = {}): Case => ({ id: "c021", category: "store_policy", question: "q?", context_slice_ids: [`ns:${rule}`], critical: true, expected: { must_refuse: false, must_match_rule: rule, ...over }, provenance: { drafted_by: "d" } });
const out = (answer: string, refused = false) => ({ answer, cited_source_ids: [], refused, refusal_reason: null });
const codes = (cs: Case, answer: string) => expectedChecks(cs, out(answer), rules).map((f) => f.code);

test("number words become digits", () => {
  expect(normalizeNumbers("Thirty days, forty-five days, one year, fifty percent")).toBe("30 days, 45 days, 1 year, 50 percent");
});

test.each([
  ["NS-R1", "You can return unworn items within 30 days of delivery.", []],
  ["NS-R1", "You have thirty days.", []],
  ["NS-R1", "You have a 30-day window.", []],
  ["NS-R1", "Returns are accepted within 45 days.", ["semantic_rule_mismatch"]],
  ["NS-R1", "The window is not 30 days.", ["semantic_rule_mismatch"]],
  ["NS-R5", "A $7 label fee is deducted.", []],
  ["NS-R5", "A 7 dollars fee applies.", []],
  ["NS-R5", "A $5 label fee is deducted.", ["semantic_rule_mismatch"]],
  ["NS-R9", "Up to 50% may be deducted.", []],
  ["NS-R4", "Refunds are issued within five business days.", []],
  ["NS-R3", "Defects are covered for one year.", []],
])("%s: %s", (rule, answer, expected) => {
  expect(codes(c(rule), answer)).toEqual(expected);
});

test("a refused answer is not checked against the rule; forbidden phrases are", () => {
  expect(expectedChecks(c("NS-R1"), out("Cannot confirm.", true), rules)).toEqual([]);
  expect(codes(c("NS-R1", { must_not_say: ["stripe guarantees"] }), "Within 30 days. Stripe guarantees this.")).toEqual(["semantic_forbidden_phrase"]);
});

test("unsupported value formats fail loudly", () => {
  expect(() => valuePattern("soon")).toThrow(/cannot build/);
});
