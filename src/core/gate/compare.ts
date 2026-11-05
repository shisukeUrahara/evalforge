import { gateRun, type GateHeads } from "./run";

export interface GateComparison {
  run_id: string;
  judge_only: { decision: string; failing: string[] };
  with_labels: { decision: string; failing: string[]; labels_used: number };
  changed: boolean;
}

const failing = (g: ReturnType<typeof gateRun>) => g.checks.filter((c) => c.status === "fail" || c.status === "pending_confirm").map((c) => `${c.id}:${c.case_ids.join(",")}`);

/**
 * The same gate twice: once on judge labels only (labels log read at length 0),
 * once with the human labels. Shows whether a judge-only gate would have made
 * a different release decision.
 */
export function compareGates(dataDir: string, runId: string, nullRun: string | undefined, heads: GateHeads): GateComparison {
  const emptyLabels = { lines: 0, sha: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" };
  const j = gateRun(dataDir, runId, { nullRun, heads: { ...heads, labels: emptyLabels } });
  const h = gateRun(dataDir, runId, { nullRun, heads });
  return {
    run_id: runId,
    judge_only: { decision: j.decision, failing: failing(j) },
    with_labels: { decision: h.decision, failing: failing(h), labels_used: heads.labels.lines },
    changed: j.decision !== h.decision || failing(j).join() !== failing(h).join(),
  };
}
