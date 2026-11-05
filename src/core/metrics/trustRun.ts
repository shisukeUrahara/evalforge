import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { logHead, readLogAt, type LogHead } from "../artifacts/logs";
import { readRunFile } from "../artifacts/runs";
import { Label } from "../domain/schemas";
import { JudgmentRow } from "../judge/runner";
import { SheetKey } from "../labels/sheet";
import { answerKey } from "../score/labels";
import { LABELS_LOG } from "./report";
import { trustReport, type LabeledClaim, type TrustLine } from "./trust";

export interface TrustFile {
  judge: string;
  set: string;
  labels_head: LogHead;
  answers_labeled: number;
  claims_labeled: number;
  lines: TrustLine[];
  trusted: boolean;
  /** Answers a human found fully supported, used as controls. */
  controls: string[];
}

/** random_half per labeled answer, from the label sheet keys. */
function sheetKeys(dataDir: string): Map<string, boolean> {
  const dir = path.join(dataDir, "data/labels/sheets");
  const out = new Map<string, boolean>();
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir).filter((x) => x.endsWith(".key.json"))) {
    for (const v of Object.values(SheetKey.parse(JSON.parse(readFileSync(path.join(dir, f), "utf8"))))) out.set(answerKey(v), v.random_half);
  }
  return out;
}

/**
 * Measures the frozen judge against human labels of one label set. Canary
 * recall comes from the canary results; controls are answers a human labeled
 * fully supported (no unsupported claims, nothing missed), up to 15.
 */
export function trustFor(dataDir: string, judge: string, set: string, runIds: readonly string[], head?: LogHead): TrustFile {
  const labelsHead = head ?? logHead(path.join(dataDir, LABELS_LOG));
  const labels = readLogAt(path.join(dataDir, LABELS_LOG), Label, labelsHead).filter((l) => runIds.includes(l.run_id));
  const judgments = new Map<string, JudgmentRow>();
  for (const id of runIds) {
    const t = readRunFile(dataDir, id, `judgments-${judge}.jsonl`);
    for (const l of t ? t.trim().split("\n") : []) {
      const j = JudgmentRow.parse(JSON.parse(l));
      judgments.set(answerKey(j), j);
    }
  }
  const random = sheetKeys(dataDir);
  const claims: LabeledClaim[] = [];
  const controls: string[] = [];
  let controlAlarms = 0;
  for (const l of labels) {
    const j = judgments.get(answerKey(l))?.output;
    if (!j) continue;
    const rh = random.get(answerKey(l)) ?? false;
    for (const h of l.claims) claims.push({ human: h.verdict, judge: j.claims[h.index]?.verdict ?? null, material: h.material, random_half: rh });
    for (const m of l.missed) claims.push({ human: m.verdict, judge: null, material: true, random_half: rh });
    const clean = l.missed.length === 0 && l.claims.every((c) => !c.material || c.verdict === "supported");
    if (clean && controls.length < 15) {
      controls.push(answerKey(l));
      if (j.claims.some((c) => c.material && c.verdict === "unsupported")) controlAlarms++;
    }
  }
  const canFile = path.join(dataDir, "data/canaries", `${set}.${judge}.results.jsonl`);
  const can = existsSync(canFile) ? readFileSync(canFile, "utf8").trim().split("\n").map((x) => JSON.parse(x) as { kind: string; caught: boolean | null }) : [];
  const real = can.filter((c) => c.kind !== "control");
  const report = trustReport(claims, { caught: real.filter((c) => c.caught).length, total: real.length }, { flagged: controlAlarms, total: controls.length });
  return { judge, set, labels_head: labelsHead, answers_labeled: labels.length, claims_labeled: claims.length, lines: report.lines, trusted: report.trusted, controls };
}
