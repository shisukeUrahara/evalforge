import { readFileSync } from "node:fs";
import path from "node:path";
import type { Confirm, GateCheck, GateResult, Waiver } from "../domain/schemas";
import type { RunMetrics } from "../metrics/report";
import { sha256Hex } from "../prompts/canonical";
import type { Mismatch } from "../run/mismatch";

export interface Rules {
  version: string;
  critical: { judge_incomplete: { max_judge_dropped: number } };
  priority: { regression_count: { categories: string[]; min: number; noise_margin: number } };
  warn: { latency_p95_up_pct: number; cost_up_pct: number };
}

export function loadRules(dataDir: string, version = "v1"): { rules: Rules; sha: string } {
  const text = readFileSync(path.join(dataDir, "gate", `rules.${version}.json`), "utf8");
  return { rules: JSON.parse(text) as Rules, sha: sha256Hex(text) };
}

/** What a waiver is bound to. Any change (prompt, model, data, rules, judge, failing cases) voids it. */
export interface WaiverKey {
  candidate_prompt_sha: string;
  candidate_model_spec: string;
  dataset_sha: string;
  rules_sha: string;
  judge_sha: string;
}

export interface GateInput {
  run_id: string;
  metrics: RunMetrics;
  /** The null run (baseline vs itself) of the same split, for the noise floor; null if not run. */
  nullMetrics: RunMetrics | null;
  mismatches: Mismatch[];
  /** Label source of each candidate case (judge-only cases can need a human confirm). */
  candidateSource: Record<string, string>;
  judgeTrusted: boolean;
  key: WaiverKey;
  waivers: readonly Waiver[];
  confirms: readonly Confirm[];
}

const sameKey = (w: Waiver, k: WaiverKey, ids: string[]) =>
  w.candidate_prompt_sha === k.candidate_prompt_sha &&
  w.candidate_model_spec === k.candidate_model_spec &&
  w.dataset_sha === k.dataset_sha &&
  w.rules_sha === k.rules_sha &&
  w.judge_sha === k.judge_sha &&
  [...w.failing_case_ids].sort().join() === [...ids].sort().join();

/**
 * Applies the pre-registered rules. Critical checks block and can never be
 * waived. Judge-only critical failures wait for a human when the judge is not
 * trusted. A priority failure blocks unless a matching waiver exists, and then
 * still shows as failed_waived.
 */
export function evaluateGate(input: GateInput, rules: Rules): GateResult & { noise_floor: number | null } {
  const m = input.metrics;
  const checks: GateCheck[] = [];
  const add = (c: Omit<GateCheck, "label_source"> & { label_source?: GateCheck["label_source"] }) => checks.push({ label_source: "deterministic", ...c });
  const mm = (code: string) => input.mismatches.filter((x) => x.code === code || (code === "case_mismatch" && x.code === "dataset_mismatch"));

  for (const id of ["context_mismatch", "case_mismatch"] as const) {
    const hits = mm(id);
    add({ id, tier: "critical", status: hits.length ? "fail" : "pass", reason_code: id, case_ids: hits.flatMap((h) => h.case_ids), detail: hits.map((h) => h.detail).join("; ") || "same cases and context" });
  }

  // Critical unsupported claims: human confirms can clear or confirm judge-only cases.
  const confirmsFor = (cid: string) => input.confirms.filter((c) => c.run_id === input.run_id && c.check_id === "critical_unsupported_claim" && c.case_id === cid).at(-1);
  const failing = m.critical_unsupported.filter((cid) => confirmsFor(cid)?.decision !== "not_unsupported");
  const needsHuman = failing.filter((cid) => input.candidateSource[cid] === "judge" && !input.judgeTrusted && !confirmsFor(cid));
  const sources = new Set(failing.map((cid) => (confirmsFor(cid) ? "human" : input.candidateSource[cid] ?? "judge")));
  add({
    id: "critical_unsupported_claim",
    tier: "critical",
    status: failing.length === 0 ? "pass" : needsHuman.length === failing.length ? "pending_confirm" : "fail",
    reason_code: "critical_unsupported_claim",
    case_ids: failing,
    label_source: failing.length === 0 ? "deterministic" : sources.size > 1 ? "mixed" : ([...sources][0] as GateCheck["label_source"]),
    detail: failing.length ? `${failing.length} critical case(s) where the candidate adds unsupported claims${needsHuman.length ? `; ${needsHuman.length} wait for a human confirm (judge not trusted)` : ""}` : "no critical case gets more unsupported claims",
  });
  add({ id: "schema_regression", tier: "critical", status: m.schema_regressions.length ? "fail" : "pass", reason_code: "schema_regression", case_ids: m.schema_regressions, detail: `${m.schema_regressions.length} case(s) newly schema-invalid` });
  const judgeDropped = m.dropped.judge.length;
  add({ id: "judge_incomplete", tier: "critical", status: judgeDropped > rules.critical.judge_incomplete.max_judge_dropped ? "fail" : "pass", reason_code: "judge_incomplete", case_ids: m.dropped.judge, detail: `${judgeDropped} case(s) dropped for judge errors (max ${rules.critical.judge_incomplete.max_judge_dropped})` });

  // Priority: regressions above the noise floor.
  const rc = rules.priority.regression_count;
  const noise = input.nullMetrics ? input.nullMetrics.regressions.gated.length : null;
  const threshold = Math.max(rc.min, (noise ?? 0) + rc.noise_margin);
  const regs = m.regressions.gated;
  const regFail = regs.length >= threshold;
  const waived = regFail && input.waivers.some((w) => w.check_id === "regression_count" && sameKey(w, input.key, regs));
  add({ id: "regression_count", tier: "priority", status: !regFail ? "pass" : waived ? "failed_waived" : "fail", reason_code: "regression_count", case_ids: regs, label_source: regs.length ? "mixed" : "deterministic", detail: `${regs.length} regression(s) in ${rc.categories.join("+")}; blocks at ${threshold} (noise floor ${noise ?? "not measured"})` });

  // Warnings.
  const [a, b] = [m.arms.find((x) => x.arm === m.baseline)!, m.arms.find((x) => x.arm === m.candidate)!];
  add({ id: "parity_mismatch", tier: "warn", status: b.parity_mismatches > a.parity_mismatches ? "warn" : "pass", reason_code: "parity_mismatch", case_ids: [], detail: `parity mismatches: baseline ${a.parity_mismatches}/${a.parity_pairs}, candidate ${b.parity_mismatches}/${b.parity_pairs}` });
  const up = (x: number, y: number) => (x > 0 ? ((y - x) / x) * 100 : 0);
  const lat = up(a.latency_ms.p95, b.latency_ms.p95);
  add({ id: "latency_p95_up", tier: "warn", status: lat > rules.warn.latency_p95_up_pct ? "warn" : "pass", reason_code: "latency_p95_up", case_ids: [], detail: `p95 ${a.latency_ms.p95} -> ${b.latency_ms.p95} ms (${lat >= 0 ? "+" : ""}${lat.toFixed(0)}%)` });
  const cost = up(a.usd_per_answer, b.usd_per_answer);
  add({ id: "cost_up", tier: "warn", status: cost > rules.warn.cost_up_pct ? "warn" : "pass", reason_code: cost < 0 ? "cost_down" : "cost_up", case_ids: [], detail: `cost per answer ${a.usd_per_answer.toFixed(6)} -> ${b.usd_per_answer.toFixed(6)} USD (${cost >= 0 ? "+" : ""}${cost.toFixed(0)}%)` });

  const criticalFail = checks.some((c) => c.tier === "critical" && c.status === "fail");
  const pending = checks.some((c) => c.status === "pending_confirm");
  const priorityFail = checks.some((c) => c.tier === "priority" && c.status === "fail");
  const decision = criticalFail || priorityFail ? "block" : pending ? "pending_confirm" : "ship";
  return { decision, checks, noise_floor: noise };
}
