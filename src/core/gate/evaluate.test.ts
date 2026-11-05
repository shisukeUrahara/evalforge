import { expect, test } from "vitest";
import type { Waiver } from "../domain/schemas";
import type { ArmMetrics } from "../metrics/eval";
import type { RunMetrics } from "../metrics/report";
import { evaluateGate, loadRules, type GateInput } from "./evaluate";

const { rules } = loadRules(process.cwd());
const arm = (a: string, over: Partial<ArmMetrics> = {}): ArmMetrics => ({ arm: a, cases: 50, pass: 40, unsupported_per_answer: 0, critical: { api_fact: [0, 0], store_policy: [0, 0] }, claims: { supported: 0, unsupported: 0, uncertain: 0 }, claim_precision: null, schema_ok: 50, parity_mismatches: 0, parity_pairs: 6, latency_ms: { mean: 100, p50: 100, p95: 1000 }, usd_per_answer: 0.001, label_sources: {}, ...over });
const metrics = (over: Partial<RunMetrics> = {}): RunMetrics => ({ run_id: "r", judge: "claims.v1", labels_head: { lines: 0, sha: "x" }, baseline: "A", candidate: "B", dropped: { transport: [], judge: [] }, arms: [arm("A"), arm("B")], regressions: { all: [], gated: [] }, critical_unsupported: [], schema_regressions: [], ...over });
const key = { candidate_prompt_sha: "p", candidate_model_spec: "m", dataset_sha: "d", rules_sha: "r", judge_sha: "j" };
const input = (over: Partial<GateInput> = {}): GateInput => ({ run_id: "r", metrics: metrics(), nullMetrics: metrics({ regressions: { all: [], gated: ["c050"] } }), mismatches: [], candidateSource: {}, judgeTrusted: true, key, waivers: [], confirms: [], ...over });
const status = (r: ReturnType<typeof evaluateGate>, id: string) => r.checks.find((c) => c.id === id)!.status;

test("a clean candidate ships", () => {
  const r = evaluateGate(input(), rules);
  expect(r.decision).toBe("ship");
  expect(r.noise_floor).toBe(1);
});

test("context or case mismatch blocks", () => {
  const r = evaluateGate(input({ mismatches: [{ code: "context_mismatch", detail: "x", case_ids: ["c001"] }, { code: "dataset_mismatch", detail: "y", case_ids: [] }] }), rules);
  expect([r.decision, status(r, "context_mismatch"), status(r, "case_mismatch")]).toEqual(["block", "fail", "fail"]);
});

test("critical unsupported: trusted judge blocks; untrusted judge waits for a human; confirms settle it", () => {
  const m = metrics({ critical_unsupported: ["c001"] });
  expect(evaluateGate(input({ metrics: m, candidateSource: { c001: "judge" } }), rules).decision).toBe("block");
  const pending = evaluateGate(input({ metrics: m, candidateSource: { c001: "judge" }, judgeTrusted: false }), rules);
  expect([pending.decision, status(pending, "critical_unsupported_claim")]).toEqual(["pending_confirm", "pending_confirm"]);
  const confirm = (decision: "unsupported" | "not_unsupported") => [{ run_id: "r", check_id: "critical_unsupported_claim", case_id: "c001", decision, by: "lee", at: "t" }];
  expect(evaluateGate(input({ metrics: m, candidateSource: { c001: "judge" }, judgeTrusted: false, confirms: confirm("unsupported") }), rules).decision).toBe("block");
  expect(evaluateGate(input({ metrics: m, candidateSource: { c001: "judge" }, judgeTrusted: false, confirms: confirm("not_unsupported") }), rules).decision).toBe("ship");
  expect(evaluateGate(input({ metrics: m, candidateSource: { c001: "human" }, judgeTrusted: false }), rules).decision).toBe("block");
});

test("schema regression and judge_incomplete block", () => {
  expect(status(evaluateGate(input({ metrics: metrics({ schema_regressions: ["c002"] }) }), rules), "schema_regression")).toBe("fail");
  const r = evaluateGate(input({ metrics: metrics({ dropped: { transport: [], judge: ["c001", "c002"] } }) }), rules);
  expect([r.decision, status(r, "judge_incomplete")]).toEqual(["block", "fail"]);
  expect(status(evaluateGate(input({ metrics: metrics({ dropped: { transport: [], judge: ["c001"] } }) }), rules), "judge_incomplete")).toBe("pass");
});

test("regressions must beat the noise floor; a matching waiver shows failed_waived; any key change voids it", () => {
  const two = metrics({ regressions: { all: ["c010", "c011"], gated: ["c010", "c011"] } });
  expect(status(evaluateGate(input({ metrics: two }), rules), "regression_count")).toBe("fail"); // 2 >= max(2, 1+1)
  expect(status(evaluateGate(input({ metrics: two, nullMetrics: metrics({ regressions: { all: [], gated: ["a", "b"] } }) }), rules), "regression_count")).toBe("pass"); // needs 3
  const w: Waiver = { check_id: "regression_count", ...key, failing_case_ids: ["c011", "c010"], reason: "tone-only change, reviewed both cases", approver: "lee", at: "t" };
  const waived = evaluateGate(input({ metrics: two, waivers: [w] }), rules);
  expect([waived.decision, status(waived, "regression_count")]).toEqual(["ship", "failed_waived"]);
  expect(evaluateGate(input({ metrics: two, waivers: [{ ...w, judge_sha: "j2" }] }), rules).decision).toBe("block");
  expect(evaluateGate(input({ metrics: two, waivers: [{ ...w, failing_case_ids: ["c010"] }] }), rules).decision).toBe("block");
});

test("warnings never block: parity, latency, cost", () => {
  const r = evaluateGate(input({ metrics: metrics({ arms: [arm("A"), arm("B", { parity_mismatches: 1, latency_ms: { mean: 0, p50: 0, p95: 1300 }, usd_per_answer: 0.002 })] }) }), rules);
  expect(r.decision).toBe("ship");
  expect(["parity_mismatch", "latency_p95_up", "cost_up"].map((id) => status(r, id))).toEqual(["warn", "warn", "warn"]);
  const cheaper = evaluateGate(input({ metrics: metrics({ arms: [arm("A"), arm("B", { usd_per_answer: 0.0004 })] }) }), rules);
  expect(cheaper.checks.find((c) => c.id === "cost_up")!.reason_code).toBe("cost_down");
});
