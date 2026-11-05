
import path from "node:path";
import { listRuns, readRunFile } from "../artifacts/runs";
import { loadPolicy } from "../context/northstar";
import { loadSlices } from "../context/slices";
import { loadPricing } from "../cost/pricing";
import { loadCases } from "../dataset/registry";
import { gateRun, type GateFile } from "../gate/run";
import type { Gateway } from "../llm/gateway";
import { runMetrics, type RunMetrics } from "../metrics/report";
import { loadPrompt } from "../prompts/registry";
import { OutputRow, runPaired } from "./paired";

export interface ReproduceLine {
  run_id: string;
  answers: string;
  metrics: string;
  gate: string;
  decision: string | null;
  ok: boolean;
}

/**
 * Rebuilds every committed run with no API key: answers replay from the cache
 * and must match outputs.jsonl; metrics.json and gate.json are recomputed from
 * the log heads they recorded and must match byte for byte.
 */
export async function reproduceAll(dataDir: string, gateway: Gateway): Promise<ReproduceLine[]> {
  const pricing = loadPricing(path.join(dataDir, "pricing.json"));
  const out: ReproduceLine[] = [];
  for (const { id, manifest } of listRuns(dataDir)) {
    const cases = loadCases(dataDir, manifest.dataset).filter((c) => c.id in manifest.context_refs);
    const rules = new Map(loadPolicy(path.join(dataDir, `fixtures/northstar/policy_${manifest.policy_version}.md`)).map((r) => [r.id, r]));
    const arms = manifest.arms.map((a) => ({ arm: a.arm, prompt: loadPrompt(dataDir, a.prompt), role: a.model }));
    const replayed = await runPaired({ cases, arms, repeats: manifest.repetitions, slices: loadSlices(dataDir, manifest.policy_version), rules, gateway });
    const stored = readRunFile(dataDir, id, "outputs.jsonl")!.trim().split("\n").map((l) => OutputRow.parse(JSON.parse(l)));
    const strip = (r: OutputRow) => JSON.stringify({ ...r, cached: undefined });
    const answersOk = replayed.length === stored.length && replayed.every((r, i) => strip(r) === strip(stored[i]));

    const mText = readRunFile(dataDir, id, "metrics.json");
    let metricsState = "none";
    if (mText) {
      const m = JSON.parse(mText) as RunMetrics;
      metricsState = JSON.stringify(runMetrics(dataDir, id, manifest, m.judge, pricing, m.labels_head), null, 2) + "\n" === mText ? "identical" : "DIFFERENT";
    }
    const gText = readRunFile(dataDir, id, "gate.json");
    let gateState = "none";
    let decision: string | null = null;
    if (gText) {
      const g = JSON.parse(gText) as GateFile;
      decision = g.decision;
      gateState = JSON.stringify(gateRun(dataDir, id, { nullRun: g.null_run ?? undefined, judge: g.judge, heads: g.heads }), null, 2) + "\n" === gText ? "identical" : "DIFFERENT";
    }
    out.push({ run_id: id, answers: answersOk ? `${stored.length} identical` : "DIFFERENT", metrics: metricsState, gate: gateState, decision, ok: answersOk && metricsState !== "DIFFERENT" && gateState !== "DIFFERENT" });
  }
  return out;
}

