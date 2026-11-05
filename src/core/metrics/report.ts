import path from "node:path";
import { logHead, readLogAt, type LogHead } from "../artifacts/logs";
import type { RunManifest } from "../artifacts/manifest";
import { readRunFile } from "../artifacts/runs";
import { actualUsd, type Pricing } from "../cost/pricing";
import { loadCases } from "../dataset/registry";
import { Label } from "../domain/schemas";
import { JudgmentRow } from "../judge/runner";
import { OutputRow } from "../run/paired";
import { armMetrics, assemble, pool, regressions, type ArmMetrics, type PooledCase, type ScoredAnswer } from "./eval";

export const LABELS_LOG = "data/labels/claims.jsonl";
export const GATED_CATEGORIES = ["store_policy", "negative"] as const;

export interface RunMetrics {
  run_id: string;
  judge: string;
  labels_head: LogHead;
  baseline: string;
  candidate: string;
  dropped: { transport: string[]; judge: string[] };
  arms: ArmMetrics[];
  regressions: { all: string[]; gated: string[] };
  /** Critical cases where the candidate has more unsupported material claims than the baseline. */
  critical_unsupported: string[];
  /** Critical cases with a schema-valid baseline and a schema-invalid candidate. */
  schema_regressions: string[];
}

export interface LoadedRun {
  manifest: RunManifest;
  rows: OutputRow[];
  scored: ScoredAnswer[];
  pooled: PooledCase[];
  dropped: RunMetrics["dropped"];
}

/** Loads a run with its judgments and the labels log read up to `labelsHead` (or the current end). */
export function loadRun(dataDir: string, runId: string, manifest: RunManifest, judge: string, labelsHead?: LogHead): LoadedRun & { labelsHead: LogHead } {
  const rows = readRunFile(dataDir, runId, "outputs.jsonl")!.trim().split("\n").map((l) => OutputRow.parse(JSON.parse(l)));
  const jText = readRunFile(dataDir, runId, `judgments-${judge}.jsonl`);
  if (!jText) throw new Error(`${runId}: no judgments-${judge}.jsonl. Run: pnpm ef judge --run ${runId}`);
  const judgments = jText.trim().split("\n").map((l) => JudgmentRow.parse(JSON.parse(l)));
  const file = path.join(dataDir, LABELS_LOG);
  const head = labelsHead ?? logHead(file);
  const labels = readLogAt(file, Label, head).filter((l) => l.run_id === runId);
  const scored = assemble(rows, judgments, labels);
  const { cases: pooled, dropped } = pool(rows, scored, manifest.arms.map((a) => a.arm));
  return { manifest, rows, scored, pooled, dropped, labelsHead: head };
}

/** Everything the gate and the UI need from one run. Deterministic: no clock, sorted ids. */
export function runMetrics(dataDir: string, runId: string, manifest: RunManifest, judge: string, pricing: Pricing, labelsHead?: LogHead): RunMetrics {
  const run = loadRun(dataDir, runId, manifest, judge, labelsHead);
  const cases = new Map(loadCases(dataDir, manifest.dataset).map((c) => [c.id, c]));
  const [base, cand] = manifest.arms.map((a) => a.arm);
  const spec = (arm: string) => manifest.arms.find((a) => a.arm === arm)!.model.spec;
  const usd = (r: OutputRow) => actualUsd(pricing, spec(r.arm), r.usage);
  const by = (arm: string) => new Map(run.pooled.filter((p) => p.arm === arm).map((p) => [p.case_id, p]));
  const a = by(base);
  const b = by(cand);
  const shared = [...a.keys()].filter((id) => b.has(id)).sort();
  return {
    run_id: runId,
    judge,
    labels_head: run.labelsHead,
    baseline: base,
    candidate: cand,
    dropped: run.dropped,
    arms: manifest.arms.map((x) => armMetrics(x.arm, run.pooled, run.scored, cases, usd)),
    regressions: { all: regressions(run.pooled, base, cand, cases), gated: regressions(run.pooled, base, cand, cases, GATED_CATEGORIES) },
    critical_unsupported: shared.filter((id) => cases.get(id)!.critical && b.get(id)!.unsupported > a.get(id)!.unsupported),
    schema_regressions: shared.filter((id) => a.get(id)!.schema_ok && !b.get(id)!.schema_ok),
  };
}
