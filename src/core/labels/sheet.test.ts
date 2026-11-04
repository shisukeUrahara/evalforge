import { expect, test } from "vitest";
import type { Case, JudgeOutput } from "../domain/schemas";
import { parseSheet, renderSheet, sampleForLabels, type Candidate, type SheetKey } from "./sheet";

const j = (verdict: "supported" | "unsupported"): JudgeOutput => ({ claims: [{ text: "Refunds take 5 days", kind: "store_policy", material: true, attributed_to: "northstar", verdict, evidence_id: null }], relevance: 4 });
const cand = (i: number, flagged: boolean): Candidate => ({ run_id: "r", case_id: `c0${10 + i}`, arm: i % 2 ? "A" : "B", repeat: 0, answer: `answer ${i}`, judgment: j(flagged ? "unsupported" : "supported") });
const cands = [...Array.from({ length: 6 }, (_, i) => cand(i, true)), ...Array.from({ length: 10 }, (_, i) => cand(i + 6, false))];
const cases = new Map(cands.map((c) => [c.case_id, { id: c.case_id, question: `question ${c.case_id}` } as Case]));

test("half flagged, half random, opaque ids, no arm or verdict on the sheet", () => {
  const items = sampleForLabels(cands, 8, 1);
  expect(items).toHaveLength(8);
  expect(items.filter((i) => !i.random_half).every((i) => i.c.judgment.claims[0].verdict === "unsupported")).toBe(true);
  expect(items.filter((i) => !i.random_half)).toHaveLength(4);
  const sheet = renderSheet(items, cases, () => "[ns:NS-R4] text");
  expect(sheet).toContain("## L01");
  expect(sheet).not.toMatch(/\| verdict: \S/); // judge verdicts are hidden
  expect(sheet).not.toMatch(/arm:/i); // arm is hidden
});

test("a filled sheet parses; blanks and unknown letters are reported", () => {
  const items = sampleForLabels(cands, 2, 1);
  const key: SheetKey = Object.fromEntries(items.map((i) => [i.item, { run_id: "r", case_id: i.c.case_id, arm: i.c.arm, repeat: 0, random_half: i.random_half, claims: 1 }]));
  const sheet = renderSheet(items, cases, () => "src");
  const filled = sheet.replace(/verdict: $/m, "verdict: u").replace(/^missed:\n/m, "missed:\n- u: Refunds need a manager\n");
  const r = parseSheet(filled, key, "owner", "t");
  expect(r.problems).toEqual(["L02 claim 1: verdict must be s, u or ?"]);
  expect(r.labels[0]).toMatchObject({ claims: [{ index: 0, material: true, verdict: "unsupported" }], missed: [{ verdict: "unsupported", text: "Refunds need a manager" }], labeler: "owner" });
});
