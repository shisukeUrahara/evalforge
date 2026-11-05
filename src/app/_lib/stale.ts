import path from "node:path";
import { logHead } from "@/core/artifacts/logs";
import { LABELS_LOG } from "@/core/metrics/report";

/** True when human labels were added after this gate ran (its labels head is behind the log). */
export function labelsChangedSince(dataDir: string, gateText: string): boolean {
  const g = JSON.parse(gateText) as { heads: { labels: { lines: number } } };
  return g.heads.labels.lines < logHead(path.join(dataDir, LABELS_LOG)).lines;
}
