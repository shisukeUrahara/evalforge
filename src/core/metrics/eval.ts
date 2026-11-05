import type { Case, Label } from "../domain/schemas";
import type { JudgmentRow } from "../judge/runner";
import { majority, median, type OutputRow } from "../run/paired";
import { scoreAnswer, type CaseScore } from "../score/casePass";
import { answerKey, mergeClaims, type FinalClaim } from "../score/labels";

export interface ScoredAnswer {
  row: OutputRow;
  claims: FinalClaim[] | null;
  score: CaseScore;
}

/** Joins outputs, judgments and human labels into one scored answer per (case, arm, repeat). */
export function assemble(rows: readonly OutputRow[], judgments: readonly JudgmentRow[], labels: readonly Label[]): ScoredAnswer[] {
  const j = new Map(judgments.map((x) => [answerKey(x), x]));
  const l = new Map(labels.map((x) => [answerKey(x), x]));
  return rows
    .filter((r) => r.transport === null)
    .map((row) => {
      const jr = j.get(answerKey(row));
      const claims = row.output_code !== "ok" ? [] : jr?.output ? mergeClaims(jr.output, l.get(answerKey(row))) : null;
      return { row, claims, score: scoreAnswer(row, claims) };
    });
}

export interface PooledCase {
  case_id: string;
  arm: string;
  pass: boolean;
  unsupported: number;
  refused: boolean | null;
  schema_ok: boolean;
  label_source: CaseScore["label_source"];
}

/**
 * Pools repeats per (case, arm): pass by majority, unsupported by median.
 * Cases with a transport failure or a judge error in any arm are dropped from
 * every arm and returned separately.
 */
export function pool(rows: readonly OutputRow[], scored: readonly ScoredAnswer[], arms: readonly string[]): { cases: PooledCase[]; dropped: { transport: string[]; judge: string[] } } {
  const transport = new Set(rows.filter((r) => r.transport !== null).map((r) => r.case_id));
  const judge = new Set(scored.filter((s) => s.score.status === "not_evaluated").map((s) => s.row.case_id));
  for (const id of transport) judge.delete(id);
  const out: PooledCase[] = [];
  const ids = [...new Set(rows.map((r) => r.case_id))].filter((id) => !transport.has(id) && !judge.has(id));
  for (const case_id of ids) {
    for (const arm of arms) {
      const mine = scored.filter((s) => s.row.case_id === case_id && s.row.arm === arm);
      if (mine.length === 0) continue;
      const sources = new Set(mine.map((s) => s.score.label_source));
      out.push({
        case_id,
        arm,
        pass: majority(mine.map((s) => s.score.status === "pass")),
        unsupported: median(mine.map((s) => s.score.unsupported)),
        refused: majority(mine.map((s) => s.row.output?.refused === true)),
        schema_ok: majority(mine.map((s) => s.row.output_code === "ok")),
        label_source: sources.size === 1 ? [...sources][0] : "mixed",
      });
    }
  }
  return { cases: out, dropped: { transport: [...transport].sort(), judge: [...judge].sort() } };
}

const pct = (xs: number[], p: number) => {
  if (!xs.length) return 0;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)];
};

export interface ArmMetrics {
  arm: string;
  cases: number;
  pass: number;
  unsupported_per_answer: number;
  critical: { api_fact: [number, number]; store_policy: [number, number] };
  claims: { supported: number; unsupported: number; uncertain: number };
  claim_precision: number | null;
  schema_ok: number;
  parity_mismatches: number;
  parity_pairs: number;
  latency_ms: { mean: number; p50: number; p95: number };
  usd_per_answer: number;
  label_sources: Record<string, number>;
}

/** Per-arm metrics with their denominators (formulas in docs/labeling_guide.md and the plan). */
export function armMetrics(arm: string, pooled: readonly PooledCase[], scored: readonly ScoredAnswer[], cases: ReadonlyMap<string, Case>, usd: (r: OutputRow) => number): ArmMetrics {
  const mine = pooled.filter((p) => p.arm === arm);
  const kept = new Set(mine.map((p) => p.case_id));
  const answers = scored.filter((s) => s.row.arm === arm && kept.has(s.row.case_id));
  const material = answers.flatMap((s) => (s.claims ?? []).filter((c) => c.material));
  const count = (v: string) => material.filter((c) => c.verdict === v).length;
  const crit = (cat: "api_fact" | "store_policy"): [number, number] => {
    const xs = mine.filter((p) => cases.get(p.case_id)!.critical && cases.get(p.case_id)!.category === cat);
    return [xs.filter((p) => p.pass).length, xs.length];
  };
  const pairs = new Map<string, PooledCase[]>();
  for (const p of mine) {
    const pid = cases.get(p.case_id)!.pair_id;
    if (pid) pairs.set(pid, [...(pairs.get(pid) ?? []), p]);
  }
  const complete = [...pairs.values()].filter((x) => x.length === 2);
  const lat = answers.map((s) => s.row.latency_ms);
  const sources: Record<string, number> = {};
  for (const p of mine) sources[p.label_source] = (sources[p.label_source] ?? 0) + 1;
  return {
    arm,
    cases: mine.length,
    pass: mine.filter((p) => p.pass).length,
    unsupported_per_answer: answers.length ? answers.reduce((s, a) => s + a.score.unsupported, 0) / answers.length : 0,
    critical: { api_fact: crit("api_fact"), store_policy: crit("store_policy") },
    claims: { supported: count("supported"), unsupported: count("unsupported"), uncertain: count("uncertain") },
    claim_precision: count("supported") + count("unsupported") ? count("supported") / (count("supported") + count("unsupported")) : null,
    schema_ok: mine.filter((p) => p.schema_ok).length,
    parity_mismatches: complete.filter(([a, b]) => a.refused !== b.refused).length,
    parity_pairs: complete.length,
    latency_ms: { mean: lat.length ? lat.reduce((a, b) => a + b, 0) / lat.length : 0, p50: pct(lat, 50), p95: pct(lat, 95) },
    usd_per_answer: answers.length ? answers.reduce((s, a) => s + usd(a.row), 0) / answers.length : 0,
    label_sources: sources,
  };
}

/** Cases the baseline passes and the candidate fails, optionally within some categories. */
export function regressions(pooled: readonly PooledCase[], base: string, cand: string, cases: ReadonlyMap<string, Case>, categories?: readonly string[]): string[] {
  const by = (arm: string) => new Map(pooled.filter((p) => p.arm === arm).map((p) => [p.case_id, p]));
  const a = by(base);
  const b = by(cand);
  return [...a.keys()]
    .filter((id) => b.has(id) && a.get(id)!.pass && !b.get(id)!.pass && (!categories || categories.includes(cases.get(id)!.category)))
    .sort();
}
