import { appendFileSync } from "node:fs";
import type { Command } from "../deps";
import { EXIT } from "../exit";
import { reproduceAll } from "@/core/run/reproduce";

/** No key needed: replays every committed run and rebuilds its metrics and gate byte for byte. */
export const reproduce: Command = async (_argv, deps) => {
  const lines = await reproduceAll(deps.dataDir, deps.makeGateway(0));
  const table = ["| run | answers | metrics.json | gate.json | decision |", "|---|---|---|---|---|", ...lines.map((l) => `| ${l.run_id} | ${l.answers} | ${l.metrics} | ${l.gate} | ${l.decision ? l.decision.toUpperCase() : "—"} |`)];
  for (const t of table) deps.out(t);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, ["## EvalForge reproduce (no API key)", "", ...table, ""].join("\n"));
  const bad = lines.filter((l) => !l.ok);
  deps.out(bad.length ? `${bad.length} run(s) did not reproduce` : `all ${lines.length} runs reproduce exactly`);
  return bad.length ? EXIT.CHECK_FAILED : EXIT.OK;
};
