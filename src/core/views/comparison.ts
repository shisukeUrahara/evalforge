import { readFileSync } from "node:fs";
import path from "node:path";
import { RunManifest } from "../artifacts/manifest";
import { readRunFile } from "../artifacts/runs";
import { buildContext } from "../context/build";
import { loadSlices } from "../context/slices";
import { loadCases } from "../dataset/registry";
import type { Case } from "../domain/schemas";
import { LABELS_LOG, loadRun } from "../metrics/report";
import { logHead } from "../artifacts/logs";
import { diffLines, type DiffLine } from "../prompts/diff";
import { loadPrompt } from "../prompts/registry";
import type { FinalClaim } from "../score/labels";
import { versionStrip, type VersionStrip } from "./common";

export interface AnswerView {
  arm: string;
  label: string;
  repeat: number;
  answer: string | null;
  raw_text: string | null;
  output_code: string;
  refused: boolean | null;
  cited: string[];
  claims: FinalClaim[];
  checks: { code: string; detail: string }[];
  pass: boolean;
}

export interface CaseRow {
  case_id: string;
  category: Case["category"];
  critical: boolean;
  base_pass: boolean;
  cand_pass: boolean;
  regression: boolean;
}

export interface ComparisonView {
  run_id: string;
  rows: CaseRow[];
  selected: {
    case: Case;
    baseline: AnswerView;
    candidate: AnswerView;
    unsupported: { baseline: number; candidate: number };
    sources: { id: string; title: string; text: string; license: string; pin: string }[];
  } | null;
  manifest: { key: string; value: string }[];
  prompt_diff: DiffLine[];
  version: VersionStrip;
}

/** Comparison page: case list with pooled pass/fail per arm, one case side by side, provenance. */
export function comparisonView(dataDir: string, runId: string, caseId?: string, judge = "claims.v1"): ComparisonView {
  const manifest = RunManifest.parse(JSON.parse(readRunFile(dataDir, runId, "manifest.json")!));
  const run = loadRun(dataDir, runId, manifest, judge, logHead(path.join(dataDir, LABELS_LOG)));
  const cases = new Map(loadCases(dataDir, manifest.dataset).map((c) => [c.id, c]));
  const [A, B] = manifest.arms;
  const pooled = (arm: string, id: string) => run.pooled.find((p) => p.arm === arm && p.case_id === id);
  const rows: CaseRow[] = Object.keys(manifest.context_refs)
    .sort()
    .map((id) => {
      const c = cases.get(id)!;
      const base_pass = pooled(A.arm, id)?.pass ?? false;
      const cand_pass = pooled(B.arm, id)?.pass ?? false;
      return { case_id: id, category: c.category, critical: c.critical, base_pass, cand_pass, regression: base_pass && !cand_pass };
    });
  const pick = caseId && cases.has(caseId) ? caseId : (rows.find((r) => r.regression) ?? rows[0]).case_id;
  const answer = (arm: string, label: string): AnswerView => {
    const s = run.scored.find((x) => x.row.case_id === pick && x.row.arm === arm && x.row.repeat === 0)!;
    return {
      arm,
      label,
      repeat: 0,
      answer: s.row.output?.answer ?? null,
      raw_text: s.row.raw_text,
      output_code: s.row.output_code,
      refused: s.row.output?.refused ?? null,
      cited: s.row.output?.cited_source_ids ?? [],
      claims: s.claims ?? [],
      checks: s.row.checks,
      pass: s.score.status === "pass",
    };
  };
  const c = cases.get(pick)!;
  const slices = loadSlices(dataDir, manifest.policy_version);
  const ctx = buildContext(c.context_slice_ids, slices);
  const stripeManifest = JSON.parse(readFileSync(path.join(dataDir, "fixtures/stripe/source_manifest.json"), "utf8")) as { commit: string };
  const label = (a: typeof A) => `${a.arm} · ${a.prompt}${a.model.spec !== A.model.spec || a.arm === "A" ? ` · ${a.model.spec.split(":")[1]}` : ""}`;
  return {
    run_id: runId,
    rows,
    selected: {
      case: c,
      baseline: answer(A.arm, label(A)),
      candidate: answer(B.arm, label(B)),
      unsupported: { baseline: pooled(A.arm, pick)?.unsupported ?? 0, candidate: pooled(B.arm, pick)?.unsupported ?? 0 },
      sources: ctx.slices.map((s) => ({ id: s.id, title: s.title, text: s.text, license: s.source === "stripe" ? "MIT" : "SYNTHETIC", pin: s.source === "stripe" ? stripeManifest.commit.slice(0, 7) : `policy ${manifest.policy_version}` })),
    },
    manifest: [
      { key: "dataset_sha", value: manifest.dataset_sha.slice(0, 12) },
      ...manifest.arms.map((a) => ({ key: `prompt ${a.arm}`, value: `${a.prompt} · ${a.prompt_sha.slice(0, 8)}` })),
      ...manifest.arms.map((a) => ({ key: `model ${a.arm}`, value: a.model.spec })),
      { key: "judge", value: judge },
      { key: "repeats", value: String(manifest.repetitions) },
      { key: "context_ref", value: ctx.ref },
      { key: "git_sha", value: manifest.git_sha.slice(0, 8) },
    ],
    prompt_diff: A.prompt === B.prompt ? [] : diffLines(loadPrompt(dataDir, A.prompt).text, loadPrompt(dataDir, B.prompt).text),
    version: versionStrip(manifest, judge, dataDir),
  };
}
