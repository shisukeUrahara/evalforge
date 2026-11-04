import { expect, test } from "vitest";
import type { JudgeOutput, Label } from "../domain/schemas";
import { trustReport, type LabeledClaim } from "../metrics/trust";
import type { OutputRow } from "../run/paired";
import { scoreAnswer } from "./casePass";
import { mergeClaims } from "./labels";

const judge: JudgeOutput = {
  claims: [
    { text: "Refunds go to the card", kind: "api_fact", material: true, attributed_to: "stripe", verdict: "supported", evidence_id: "stripe:refunds.create" },
    { text: "Happy to help", kind: "general", material: false, attributed_to: "none", verdict: "unsupported", evidence_id: null },
  ],
  relevance: 5,
};
const label: Label = { run_id: "r", case_id: "c001", arm: "B", repeat: 0, claims: [{ index: 0, material: true, verdict: "unsupported" }], missed: [{ text: "Within 10 days", verdict: "unsupported" }], labeler: "owner", at: "t" };
const row = (over: Partial<OutputRow> = {}) => ({ output_code: "ok", checks: [], output: {}, ...over }) as unknown as OutputRow;

test("human labels win, missed claims are added, every claim names its source", () => {
  const merged = mergeClaims(judge, label);
  expect(merged.map((c) => [c.verdict, c.source, c.judge_verdict])).toEqual([
    ["unsupported", "human", "supported"],
    ["unsupported", "judge", "unsupported"],
    ["unsupported", "human", null],
  ]);
  expect(mergeClaims(judge, undefined).every((c) => c.source === "judge")).toBe(true);
});

test("case pass: non-material claims do not count; unsupported and uncertain material claims fail", () => {
  expect(scoreAnswer(row(), mergeClaims(judge, undefined))).toMatchObject({ status: "pass", unsupported: 0, label_source: "judge" });
  expect(scoreAnswer(row(), mergeClaims(judge, label))).toMatchObject({ status: "fail", unsupported: 2, label_source: "human" });
  const unsure = { ...judge, claims: [{ ...judge.claims[0], verdict: "uncertain" as const }] };
  expect(scoreAnswer(row(), mergeClaims(unsure, undefined)).reasons).toEqual(["semantic_uncertain_claim"]);
});

test("schema failures fail deterministically; a missing judgment is not_evaluated, never a pass", () => {
  expect(scoreAnswer(row({ output_code: "schema_invalid" }), null)).toMatchObject({ status: "fail", reasons: ["schema_invalid"] });
  expect(scoreAnswer(row(), null).status).toBe("not_evaluated");
  expect(scoreAnswer(row({ checks: [{ code: "semantic_wrong_refusal", detail: "" }] }), mergeClaims(judge, undefined)).status).toBe("fail");
});

const lc = (human: LabeledClaim["human"], judgeV: LabeledClaim["judge"], random_half = true): LabeledClaim => ({ human, judge: judgeV, material: true, random_half });

test("trust bar boundaries: recall needs 15 random-half unsupported claims; 0.8 passes", () => {
  const fourteen = Array.from({ length: 14 }, () => lc("unsupported", "unsupported"));
  expect(trustReport(fourteen, { caught: 9, total: 10 }, { flagged: 0, total: 5 }).lines[1].status).toBe("not_estimable");
  const fifteen = [...Array.from({ length: 12 }, () => lc("unsupported", "unsupported")), ...Array.from({ length: 3 }, () => lc("unsupported", "supported")), ...Array.from({ length: 15 }, () => lc("supported", "supported"))];
  const r = trustReport(fifteen, { caught: 9, total: 10 }, { flagged: 1, total: 5 });
  expect(r.lines[1]).toMatchObject({ value: 0.8, n: 15, status: "pass" });
  expect(r.lines[3].status).toBe("pass"); // 0.9 canary recall passes
  expect(r.lines[4].status).toBe("pass"); // 0.2 control FPR passes
  expect(r.trusted).toBe(r.lines.every((l) => l.status === "pass"));
});

test("flagged-half claims do not count toward recall; kappa below 0.6 fails", () => {
  const flaggedOnly = Array.from({ length: 20 }, () => lc("unsupported", "unsupported", false));
  expect(trustReport(flaggedOnly, { caught: 0, total: 0 }, { flagged: 0, total: 0 }).lines[1].status).toBe("not_estimable");
  const disagree = [lc("supported", "unsupported"), lc("unsupported", "supported"), lc("supported", "supported"), lc("unsupported", "unsupported")];
  expect(trustReport(disagree, { caught: 0, total: 0 }, { flagged: 0, total: 0 }).lines[0].status).toBe("fail");
});
