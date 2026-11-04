import { expect, test } from "vitest";
import { loadSlices } from "../context/slices";
import type { Case } from "../domain/schemas";
import { datasetSha } from "./registry";
import { jaccard, lintCases } from "./lint";

const slices = loadSlices(process.cwd());
const base: Case = {
  id: "c001",
  category: "store_policy",
  question: "How many days do I have to return unworn hiking boots?",
  context_slice_ids: ["ns:NS-R1"],
  critical: true,
  expected: { must_refuse: false, must_cite: ["ns:NS-R1"], must_match_rule: "NS-R1" },
  provenance: { drafted_by: "test" },
};
const msgs = (cases: Case[], split?: Record<string, "tuning" | "holdout">) => lintCases(cases, slices, split).map((i) => `${i.level} ${i.case_id} ${i.message}`);

test("a clean case has no issues", () => {
  expect(msgs([base])).toEqual([]);
});

test("duplicate ids, unknown slices and citations outside the context are errors", () => {
  expect(msgs([base, { ...base, question: "Something else entirely about gift cards" }])).toContain("error c001 duplicate id");
  expect(msgs([{ ...base, context_slice_ids: ["stripe:nope"], expected: { must_refuse: false } }])).toContain("error c001 unknown slice stripe:nope");
  expect(msgs([{ ...base, expected: { must_refuse: false, must_cite: ["ns:NS-R2"] } }])).toContain("error c001 must_cite ns:NS-R2 is not in its context");
});

test("pairs need exactly two halves with the same expected refusal", () => {
  const a: Case = { ...base, id: "c061", category: "parity", pair_id: "p01" };
  expect(msgs([a])).toContain("error c061 pair p01 has 1 cases, needs 2");
  const b: Case = { ...a, id: "c062", question: "Maria asks: how many days to return boots?", expected: { must_refuse: true } };
  expect(msgs([a, b])).toContain("error c061 pair p01 halves expect different refusals");
});

test("near-duplicates warn; across tuning and holdout they are a leak", () => {
  const twin = { ...base, id: "c002", question: "How many days do I have to return unworn hiking boots ?" };
  expect(jaccard(base.question, twin.question)).toBeGreaterThanOrEqual(0.8);
  expect(msgs([base, twin])).toEqual(["warn c001 near-duplicate of c002"]);
  expect(msgs([base, twin], { c001: "tuning", c002: "holdout" })).toEqual(["error c001 leak: near-duplicate of c002"]);
});

test("dataset sha ignores order but not content", () => {
  const b = { ...base, id: "c002", question: "Another question about the label fee" };
  expect(datasetSha([base, b])).toBe(datasetSha([b, base]));
  expect(datasetSha([base, b])).not.toBe(datasetSha([base, { ...b, critical: false }]));
});
