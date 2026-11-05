import { expect, test } from "vitest";
import type { Case, JudgeOutput } from "../domain/schemas";
import type { JudgmentRow } from "../judge/runner";
import type { OutputRow } from "../run/paired";
import { armMetrics, assemble, pool, regressions } from "./eval";

const cs = (id: string, category: Case["category"], critical = true, pair_id?: string) => ({ id, category, critical, pair_id }) as Case;
const cases = new Map([cs("c001", "api_fact"), cs("c002", "store_policy"), cs("c003", "negative", false), cs("c061", "parity", false, "p01"), cs("c062", "parity", false, "p01")].map((c) => [c.id, c]));
const row = (case_id: string, arm: string, repeat: number, over: Partial<OutputRow> = {}) =>
  ({ case_id, arm, repeat, transport: null, output_code: "ok", checks: [], latency_ms: 100 + repeat, usage: { input_tokens: 0, output_tokens: 0 }, output: { answer: "x", cited_source_ids: [], refused: false, refusal_reason: null }, ...over }) as OutputRow;
const j = (verdicts: ("supported" | "unsupported")[]): JudgeOutput => ({ claims: verdicts.map((verdict) => ({ text: "t", kind: "api_fact", material: true, attributed_to: "stripe", verdict, evidence_id: null })), relevance: 4 });
const jr = (case_id: string, arm: string, repeat: number, out: JudgeOutput | null) => ({ case_id, arm, repeat, output: out, status: out ? "ok" : "judge_error" }) as JudgmentRow;

test("pooling: majority pass over repeats, median unsupported; transport and judge errors drop the case from all arms", () => {
  const rows = [0, 1, 2].flatMap((r) => [row("c001", "A", r), row("c001", "B", r), row("c002", "A", r), row("c002", "B", r), row("c003", "A", r), row("c003", "B", r, r === 0 ? { transport: "transport_5xx", output: null } : {})]);
  const judg = [0, 1, 2].flatMap((r) => [jr("c001", "A", r, j(["supported"])), jr("c001", "B", r, j(r < 2 ? ["unsupported"] : ["supported"])), jr("c002", "A", r, j(["supported"])), jr("c002", "B", r, r === 0 ? null : j(["supported"])), jr("c003", "A", r, j([])), jr("c003", "B", r, j([]))]);
  const p = pool(rows, assemble(rows, judg, []), ["A", "B"]);
  expect(p.dropped).toEqual({ transport: ["c003"], judge: ["c002"] });
  expect(p.cases.map((c) => [c.case_id, c.arm, c.pass, c.unsupported])).toEqual([
    ["c001", "A", true, 0],
    ["c001", "B", false, 1],
  ]);
  expect(regressions(p.cases, "A", "B", cases)).toEqual(["c001"]);
  expect(regressions(p.cases, "A", "B", cases, ["negative"])).toEqual([]);
});

test("arm metrics: critical accuracy per category, precision, parity, latency percentiles", () => {
  const rows = [row("c001", "A", 0), row("c002", "A", 0, { checks: [{ code: "semantic_rule_mismatch", detail: "" }] }), row("c061", "A", 0), row("c062", "A", 0, { output: { answer: "x", cited_source_ids: [], refused: true, refusal_reason: "r" } })];
  const judg = [jr("c001", "A", 0, j(["supported", "unsupported"])), jr("c002", "A", 0, j(["supported"])), jr("c061", "A", 0, j([])), jr("c062", "A", 0, j([]))];
  const scored = assemble(rows, judg, []);
  const m = armMetrics("A", pool(rows, scored, ["A"]).cases, scored, cases, () => 0.001);
  expect(m.critical).toEqual({ api_fact: [0, 1], store_policy: [0, 1] });
  expect(m.claims).toEqual({ supported: 2, unsupported: 1, uncertain: 0 });
  expect(m.claim_precision).toBeCloseTo(2 / 3, 10);
  expect([m.parity_mismatches, m.parity_pairs]).toEqual([1, 1]);
  expect(m.unsupported_per_answer).toBe(0.25);
  expect(m.latency_ms.p95).toBe(100);
  expect(m.usd_per_answer).toBeCloseTo(0.001, 10);
});
