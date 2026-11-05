import { readRunFile } from "../artifacts/runs";
import { RunManifest } from "../artifacts/manifest";
import type { GateCheck, Tier } from "../domain/schemas";
import type { GateFile } from "../gate/run";
import { trustFor } from "../metrics/trustRun";
import type { TrustLine } from "../metrics/trust";
import { gatedCandidates, versionStrip, type Candidate, type VersionStrip } from "./common";

export interface GateView {
  candidates: Candidate[];
  selected: Candidate;
  decision: GateFile["decision"];
  what_changed: string;
  counts: { checks: number; failed: number; warnings: number; pending: number };
  tiers: { tier: Tier; checks: GateCheck[] }[];
  noise_floor: number | null;
  trust: { trusted: boolean; source: string; lines: TrustLine[] };
  waivers_used: number;
  confirms_used: number;
  version: VersionStrip;
  gate_file: string;
}

/** Everything the Release gate page shows for one candidate. Null when nothing has been gated yet. */
export function gateView(dataDir: string, arm?: string): GateView | null {
  const candidates = gatedCandidates(dataDir);
  if (candidates.length === 0) return null;
  const selected = candidates.find((c) => c.arm === arm) ?? candidates[0];
  const gText = readRunFile(dataDir, selected.run_id, "gate.json")!;
  const g = JSON.parse(gText) as GateFile;
  const manifest = RunManifest.parse(JSON.parse(readRunFile(dataDir, selected.run_id, "manifest.json")!));
  const [a, b] = manifest.arms;
  const what_changed = a.prompt !== b.prompt ? `prompt ${a.prompt} → ${b.prompt}` : `model ${a.model.spec} → ${b.model.spec}`;
  const t = trustFor(dataDir, g.judge, "holdout", [selected.run_id, ...(g.null_run ? [g.null_run] : [])], g.heads.labels);
  return {
    candidates,
    selected,
    decision: g.decision,
    what_changed,
    counts: {
      checks: g.checks.length,
      failed: g.checks.filter((c) => c.status === "fail" || c.status === "failed_waived").length,
      warnings: g.checks.filter((c) => c.status === "warn").length,
      pending: g.checks.filter((c) => c.status === "pending_confirm").length,
    },
    tiers: (["critical", "priority", "warn"] as Tier[]).map((tier) => ({ tier, checks: g.checks.filter((c) => c.tier === tier) })),
    noise_floor: g.noise_floor,
    trust: { trusted: g.judge_trusted, source: g.trust_source, lines: t.lines },
    waivers_used: g.heads.waivers.lines,
    confirms_used: g.heads.confirms.lines,
    version: versionStrip(manifest, g.judge, dataDir),
    gate_file: gText,
  };
}
