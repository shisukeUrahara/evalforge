import { writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { runsDir } from "@/core/artifacts/runs";
import { gateRun } from "@/core/gate/run";
import type { Command } from "../deps";
import { EXIT } from "../exit";

const ICON: Record<string, string> = { pass: "pass", fail: "FAIL", warn: "warn", pending_confirm: "PENDING", failed_waived: "failed+waived" };

/** Writes runs/<id>/gate.json. Exit 0 = ship; exit 1 = block or pending confirm. */
export const gate: Command = async (argv, deps) => {
  const { values } = parseArgs({ args: argv, options: { run: { type: "string" }, null: { type: "string" }, judge: { type: "string", default: "claims.v1" } } });
  if (!values.run) {
    deps.err("usage: ef gate --run <candidate run id> [--null <null run id>]");
    return EXIT.USAGE;
  }
  const g = gateRun(deps.dataDir, values.run, { nullRun: values.null, judge: values.judge });
  writeFileSync(path.join(runsDir(deps.dataDir), values.run, "gate.json"), JSON.stringify(g, null, 2) + "\n");
  deps.out(`${g.decision.toUpperCase()} · candidate ${g.candidate.arm} (${g.candidate.prompt}, ${g.candidate.model}) · judge ${g.judge_trusted ? "trusted" : "not trusted"} · noise floor ${g.noise_floor ?? "not measured"}`);
  for (const c of g.checks) deps.out(`  ${c.tier.padEnd(8)} ${c.reason_code.padEnd(27)} ${ICON[c.status].padEnd(13)} ${c.case_ids.slice(0, 6).join(" ")}${c.case_ids.length > 6 ? " …" : ""}  ${c.detail}`);
  return g.decision === "ship" ? EXIT.OK : EXIT.CHECK_FAILED;
};
