import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { logHead, readLogAt, type LogHead } from "../artifacts/logs";
import { RunManifest } from "../artifacts/manifest";
import { readRunFile } from "../artifacts/runs";
import { loadPricing } from "../cost/pricing";
import { Confirm, Waiver } from "../domain/schemas";
import { LABELS_LOG, loadRun, runMetrics } from "../metrics/report";
import { loadPrompt } from "../prompts/registry";
import { checkComparable } from "../run/mismatch";
import { evaluateGate, loadRules } from "./evaluate";
import { CONFIRMS_LOG, WAIVERS_LOG } from "./logs";

export interface GateHeads {
  labels: LogHead;
  waivers: LogHead;
  confirms: LogHead;
}

const manifestOf = (dataDir: string, id: string) => {
  const t = readRunFile(dataDir, id, "manifest.json");
  if (!t) throw new Error(`no run ${id}`);
  return RunManifest.parse(JSON.parse(t));
};

/** Trust status written by `ef trust`; absent (no human labels yet) means not trusted. */
export function judgeTrust(dataDir: string, judge: string): { trusted: boolean; source: string } {
  const f = path.join(dataDir, "data/labels", `trust-${judge}.json`);
  if (!existsSync(f)) return { trusted: false, source: "no trust report yet (human labels pending)" };
  const t = JSON.parse(readFileSync(f, "utf8")) as { trusted: boolean };
  return { trusted: t.trusted, source: path.relative(dataDir, f) };
}

/**
 * The full gate for one candidate run. Reads every log only up to the given
 * heads (default: their current end) so `ef reproduce` can rebuild the exact
 * same gate.json later. No clock fields.
 */
export function gateRun(dataDir: string, runId: string, opts: { nullRun?: string; judge?: string; heads?: GateHeads }) {
  const judge = opts.judge ?? "claims.v1";
  const heads: GateHeads = opts.heads ?? {
    labels: logHead(path.join(dataDir, LABELS_LOG)),
    waivers: logHead(path.join(dataDir, WAIVERS_LOG)),
    confirms: logHead(path.join(dataDir, CONFIRMS_LOG)),
  };
  const pricing = loadPricing(path.join(dataDir, "pricing.json"));
  const manifest = manifestOf(dataDir, runId);
  const metrics = runMetrics(dataDir, runId, manifest, judge, pricing, heads.labels);
  const nullManifest = opts.nullRun ? manifestOf(dataDir, opts.nullRun) : null;
  const nullMetrics = opts.nullRun ? runMetrics(dataDir, opts.nullRun, nullManifest!, judge, pricing, heads.labels) : null;
  const { rules, sha: rulesSha } = loadRules(dataDir);
  const judgePrompt = loadPrompt(dataDir, judge, "judge");
  const trust = judgeTrust(dataDir, judge);
  const run = loadRun(dataDir, runId, manifest, judge, heads.labels);
  const cand = manifest.arms[1];
  const candidateSource = Object.fromEntries(run.pooled.filter((p) => p.arm === cand.arm).map((p) => [p.case_id, p.label_source]));
  const result = evaluateGate(
    {
      run_id: runId,
      metrics,
      nullMetrics,
      mismatches: nullManifest ? checkComparable(manifest, nullManifest) : [],
      candidateSource,
      judgeTrusted: trust.trusted,
      key: { candidate_prompt_sha: cand.prompt_sha, candidate_model_spec: cand.model.spec, dataset_sha: manifest.dataset_sha, rules_sha: rulesSha, judge_sha: judgePrompt.sha },
      waivers: readLogAt(path.join(dataDir, WAIVERS_LOG), Waiver, heads.waivers),
      confirms: readLogAt(path.join(dataDir, CONFIRMS_LOG), Confirm, heads.confirms),
    },
    rules,
  );
  return {
    run_id: runId,
    candidate: { arm: cand.arm, prompt: cand.prompt, model: cand.model.spec },
    null_run: opts.nullRun ?? null,
    decision: result.decision,
    noise_floor: result.noise_floor,
    judge_trusted: trust.trusted,
    trust_source: trust.source,
    rules_version: rules.version,
    rules_sha: rulesSha,
    judge,
    judge_sha: judgePrompt.sha,
    heads,
    checks: result.checks,
    metrics,
  };
}
export type GateFile = ReturnType<typeof gateRun>;
