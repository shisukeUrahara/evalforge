import { expect, test } from "vitest";
import type { Case } from "../domain/schemas";
import { applyCaseReview, type CaseReview } from "./review";

const c = (id: string): Case => ({ id, category: "store_policy", question: "Can I return boots?", context_slice_ids: ["ns:NS-R1"], critical: true, expected: { must_refuse: true }, provenance: { drafted_by: "d" } });
const r = (case_id: string, over: Partial<CaseReview> = {}): CaseReview => ({ case_id, verdict: "ok", changes: {}, note: "fine", reviewer: "claude-review", ...over });

test("ok keeps the case and records the reviewer; fixed applies only the changes", () => {
  const out = applyCaseReview([c("c001"), c("c002")], [r("c001"), r("c002", { verdict: "fixed", changes: { critical: false, expected: { must_refuse: false, must_match_rule: "NS-R1" } }, note: "answerable" })]);
  expect(out).toMatchObject({ fixed: 1, ok: 1 });
  expect(out.cases[0].provenance.reviewed_by).toBe("claude-review");
  expect(out.cases[1]).toMatchObject({ critical: false, question: "Can I return boots?", expected: { must_refuse: false, must_match_rule: "NS-R1" } });
});

test("missing, duplicate, unknown and empty-fix reviews are refused", () => {
  expect(() => applyCaseReview([c("c001")], [])).toThrow(/c001: no review/);
  expect(() => applyCaseReview([c("c001")], [r("c001"), r("c001")])).toThrow(/reviewed twice/);
  expect(() => applyCaseReview([c("c001")], [r("c001"), r("c009")])).toThrow(/unknown case/);
  expect(() => applyCaseReview([c("c001")], [r("c001", { verdict: "fixed" })])).toThrow(/no changes/);
});

test("a fix that breaks the schema is refused", () => {
  expect(() => applyCaseReview([c("c001")], [r("c001", { verdict: "fixed", changes: { context_slice_ids: ["bad id"] } })])).toThrow();
});
