import { existsSync } from "node:fs";
import path from "node:path";
import { listRuns, readRunFile } from "../artifacts/runs";
import type { RunManifest } from "../artifacts/manifest";
import type { GateFile } from "../gate/run";
import { loadPrompt } from "../prompts/registry";

/** What the version strip shows on every page. */
export interface VersionStrip {
  dataset: string;
  dataset_sha: string;
  prompts: string[];
  models: string[];
  judge: string;
  judge_sha: string;
  run_id: string;
}

export function versionStrip(manifest: RunManifest, judge: string, dataDir: string): VersionStrip {
  return {
    dataset: manifest.dataset,
    dataset_sha: manifest.dataset_sha.slice(0, 7),
    prompts: [...new Set(manifest.arms.map((a) => `${a.prompt}`))],
    models: [...new Set(manifest.arms.map((a) => a.model.spec))],
    judge,
    judge_sha: loadPrompt(dataDir, judge, "judge").sha.slice(0, 7),
    run_id: manifest.run_id,
  };
}

export interface Candidate {
  run_id: string;
  arm: string;
  label: string;
  kind: "prompt change" | "model swap" | "injected test";
  decision: string;
}

const KIND: Record<string, Candidate["kind"]> = { B: "prompt change", M: "model swap", C: "injected test" };

/** Gated runs, one per candidate arm (newest wins), in B, M, C order. */
export function gatedCandidates(dataDir: string): Candidate[] {
  const seen = new Map<string, Candidate>();
  for (const { id, manifest } of listRuns(dataDir)) {
    const g = readRunFile(dataDir, id, "gate.json");
    const arm = manifest.arms[1].arm;
    if (!g || seen.has(arm) || !KIND[arm]) continue;
    const gate = JSON.parse(g) as GateFile;
    const label = arm === "M" ? `M · model swap (${manifest.arms[1].model.spec.split(":")[1]})` : arm === "B" ? "B · friendlier prompt" : "C · injected test";
    seen.set(arm, { run_id: id, arm, label, kind: KIND[arm], decision: gate.decision });
  }
  return ["B", "M", "C"].flatMap((a) => (seen.has(a) ? [seen.get(a)!] : []));
}

export const hasData = (dataDir: string) => existsSync(path.join(dataDir, "runs"));
