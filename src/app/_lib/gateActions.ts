import { writeFileSync } from "node:fs";
import path from "node:path";
import { RunManifest } from "@/core/artifacts/manifest";
import { readRunFile, runsDir } from "@/core/artifacts/runs";
import { requireAction } from "@/core/auth/roles";
import { loadRules } from "@/core/gate/evaluate";
import { addConfirm, addWaiver } from "@/core/gate/logs";
import { gateRun, type GateFile } from "@/core/gate/run";
import { loadPrompt } from "@/core/prompts/registry";

function readGate(dataDir: string, runId: string): GateFile {
  const t = readRunFile(dataDir, runId, "gate.json");
  if (!t) throw new Error(`no gate.json for run ${runId}`);
  return JSON.parse(t) as GateFile;
}

/** Recomputes the gate with the same null run and judge and rewrites gate.json exactly like `ef gate`. */
export function regate(dataDir: string, runId: string): GateFile {
  const old = readGate(dataDir, runId);
  const g = gateRun(dataDir, runId, { nullRun: old.null_run ?? undefined, judge: old.judge });
  writeFileSync(path.join(runsDir(dataDir), runId, "gate.json"), JSON.stringify(g, null, 2) + "\n");
  return g;
}

/** Waives one failing priority check (lee only), then regates. */
export function waiveCheck(dataDir: string, a: { runId: string; checkId: string; reason: string; user: string; now: Date }): GateFile {
  requireAction(a.user, "waive");
  const gate = readGate(dataDir, a.runId);
  const check = gate.checks.find((c) => c.id === a.checkId);
  if (!check || check.tier !== "priority" || check.status !== "fail") throw new Error(`${a.checkId} is not a failing priority check in this gate`);
  const m = RunManifest.parse(JSON.parse(readRunFile(dataDir, a.runId, "manifest.json")!));
  const cand = m.arms[1];
  addWaiver(dataDir, {
    check_id: check.id,
    candidate_prompt_sha: cand.prompt_sha,
    candidate_model_spec: cand.model.spec,
    dataset_sha: m.dataset_sha,
    rules_sha: loadRules(dataDir).sha,
    judge_sha: loadPrompt(dataDir, gate.judge, "judge").sha,
    failing_case_ids: check.case_ids,
    reason: a.reason,
    approver: a.user,
    at: a.now.toISOString(),
  });
  return regate(dataDir, a.runId);
}

/** Records a human check of one pending critical case (lee only), then regates. */
export function confirmCase(dataDir: string, a: { runId: string; caseId: string; decision: "unsupported" | "not_unsupported"; user: string; now: Date }): GateFile {
  requireAction(a.user, "confirm");
  const check = readGate(dataDir, a.runId).checks.find((c) => c.id === "critical_unsupported_claim");
  if (!check || check.status !== "pending_confirm" || !check.case_ids.includes(a.caseId)) throw new Error(`${a.caseId} is not waiting for a confirm in this gate`);
  addConfirm(dataDir, { run_id: a.runId, check_id: check.id, case_id: a.caseId, decision: a.decision, by: a.user, at: a.now.toISOString() });
  return regate(dataDir, a.runId);
}
