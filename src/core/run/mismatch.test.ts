import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { checkComparable } from "./mismatch";

const load = (n: string) => JSON.parse(readFileSync(`runs/fixtures/stale-context/${n}.json`, "utf8"));

test("the stale-context fixture (v1 vs v2 policy) is caught as context_mismatch on the NS-R1/R5 cases only", () => {
  const out = checkComparable(load("baseline"), load("candidate"));
  expect(out.map((m) => m.code)).toEqual(["context_mismatch"]);
  expect(out[0].case_ids.length).toBeGreaterThan(0);
  const base = load("baseline");
  expect(out[0].case_ids.length).toBeLessThan(Object.keys(base.context_refs).length);
});

test("same runs compare clean; missing cases and another dataset are named", () => {
  const a = { dataset_sha: "x", context_refs: { c001: "ctx_1", c002: "ctx_2" } };
  expect(checkComparable(a, a)).toEqual([]);
  expect(checkComparable(a, { dataset_sha: "y", context_refs: { c001: "ctx_1" } }).map((m) => [m.code, m.case_ids])).toEqual([
    ["dataset_mismatch", []],
    ["case_mismatch", ["c002"]],
  ]);
});
