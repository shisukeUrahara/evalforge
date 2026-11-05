import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { RunManifest } from "../artifacts/manifest";
import { readRunFile } from "../artifacts/runs";
import { trustFor, type TrustFile } from "../metrics/trustRun";
import { wilson } from "../metrics/wilson";
import { gatedCandidates, versionStrip, type VersionStrip } from "./common";

export interface CanarySet {
  set: string;
  caught: number;
  total: number;
  range: { low: number; high: number };
  missed: { canary_id: string; injected_value: string | null }[];
}

export interface JudgeView {
  trust: TrustFile;
  labels_pending: boolean;
  canaries: CanarySet[];
  changelog: string[];
  version: VersionStrip | null;
}

function canarySet(dataDir: string, set: string, judge: string): CanarySet | null {
  const f = path.join(dataDir, "data/canaries", `${set}.${judge}.results.jsonl`);
  if (!existsSync(f)) return null;
  const rows = readFileSync(f, "utf8").trim().split("\n").map((l) => JSON.parse(l) as { canary_id: string; kind: string; caught: boolean | null; injected_value: string | null });
  const real = rows.filter((r) => r.kind !== "control");
  const caught = real.filter((r) => r.caught).length;
  return { set, caught, total: real.length, range: wilson(caught, real.length), missed: real.filter((r) => !r.caught).map((r) => ({ canary_id: r.canary_id, injected_value: r.injected_value })) };
}

/** Judge audit page: how far the frozen judge can be trusted, with N and ranges everywhere. */
export function judgeView(dataDir: string, judge = "claims.v1"): JudgeView {
  const b = gatedCandidates(dataDir).find((c) => c.arm === "B");
  const runs = b ? [b.run_id] : [];
  const trust = trustFor(dataDir, judge, "holdout", runs);
  const manifest = b ? RunManifest.parse(JSON.parse(readRunFile(dataDir, b.run_id, "manifest.json")!)) : null;
  return {
    trust,
    labels_pending: trust.answers_labeled === 0,
    canaries: ["tuning", "holdout"].flatMap((s) => canarySet(dataDir, s, judge) ?? []),
    changelog: [
      "claims.v1 frozen before the holdout run (5 Nov 2026).",
      "No tuning round: human labels arrive after the build, so they only measure v1, never change it.",
      "Stop rule: no judge edits after the holdout run; a failed trust bar makes the judge advisory.",
    ],
    version: manifest ? versionStrip(manifest, judge, dataDir) : null,
  };
}
