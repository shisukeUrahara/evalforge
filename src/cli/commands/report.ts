import { writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { RunManifest } from "@/core/artifacts/manifest";
import { readRunFile, runsDir } from "@/core/artifacts/runs";
import { loadPricing } from "@/core/cost/pricing";
import { runMetrics } from "@/core/metrics/report";
import type { Command } from "../deps";
import { EXIT } from "../exit";

/** Writes runs/<id>/metrics.json and prints the headline numbers. */
export const report: Command = async (argv, deps) => {
  const { values } = parseArgs({ args: argv, options: { run: { type: "string" }, judge: { type: "string", default: "claims.v1" } } });
  const mText = values.run ? readRunFile(deps.dataDir, values.run, "manifest.json") : null;
  if (!values.run || !mText) {
    deps.err("usage: ef report --run <run id>");
    return EXIT.USAGE;
  }
  const m = runMetrics(deps.dataDir, values.run, RunManifest.parse(JSON.parse(mText)), values.judge, loadPricing(path.join(deps.dataDir, "pricing.json")));
  writeFileSync(path.join(runsDir(deps.dataDir), values.run, "metrics.json"), JSON.stringify(m, null, 2) + "\n");
  for (const a of m.arms) {
    deps.out(`${a.arm}: ${a.pass}/${a.cases} cases pass · ${a.unsupported_per_answer.toFixed(2)} unsupported claims per answer · critical api ${a.critical.api_fact[0]}/${a.critical.api_fact[1]}, store ${a.critical.store_policy[0]}/${a.critical.store_policy[1]} · parity mismatches ${a.parity_mismatches}/${a.parity_pairs} · p95 ${a.latency_ms.p95} ms`);
  }
  deps.out(`regressions ${m.baseline}->${m.candidate}: ${m.regressions.all.length} (${m.regressions.gated.length} in store_policy+negative) · critical unsupported ${m.critical_unsupported.length} · dropped ${m.dropped.transport.length} transport, ${m.dropped.judge.length} judge · labels used ${m.labels_head.lines}`);
  return EXIT.OK;
};
