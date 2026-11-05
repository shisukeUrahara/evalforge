import { writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { logHead } from "@/core/artifacts/logs";
import { runsDir } from "@/core/artifacts/runs";
import { compareGates } from "@/core/gate/compare";
import { CONFIRMS_LOG, WAIVERS_LOG } from "@/core/gate/logs";
import { LABELS_LOG } from "@/core/metrics/report";
import type { Command } from "../deps";
import { EXIT } from "../exit";

/** Would a judge-only gate have decided differently from the gate with human labels? */
export const compareGatesCmd: Command = async (argv, deps) => {
  const { values } = parseArgs({ args: argv, options: { run: { type: "string" }, null: { type: "string" } } });
  if (!values.run) {
    deps.err("usage: ef compare-gates --run <run id> [--null <null run id>]");
    return EXIT.USAGE;
  }
  const heads = { labels: logHead(path.join(deps.dataDir, LABELS_LOG)), waivers: logHead(path.join(deps.dataDir, WAIVERS_LOG)), confirms: logHead(path.join(deps.dataDir, CONFIRMS_LOG)) };
  const c = compareGates(deps.dataDir, values.run, values.null, heads);
  writeFileSync(path.join(runsDir(deps.dataDir), values.run, "gate-compare.json"), JSON.stringify(c, null, 2) + "\n");
  deps.out(`judge-only gate: ${c.judge_only.decision.toUpperCase()} · with ${c.with_labels.labels_used} human labels: ${c.with_labels.decision.toUpperCase()} · ${c.changed ? "DIFFERENT" : "same"} decision and failing cases`);
  return EXIT.OK;
};
