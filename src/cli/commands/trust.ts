import { writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { trustFor } from "@/core/metrics/trustRun";
import type { Command } from "../deps";
import { EXIT } from "../exit";

/** Measures the judge against human labels; writes data/labels/trust-<judge>.json, which the gate reads. */
export const trust: Command = async (argv, deps) => {
  const { values } = parseArgs({ args: argv, options: { judge: { type: "string", default: "claims.v1" }, set: { type: "string", default: "holdout" }, run: { type: "string", multiple: true } } });
  if (!values.run?.length) {
    deps.err("usage: ef trust --run <labeled run id> [--run ...] [--set holdout]");
    return EXIT.USAGE;
  }
  const t = trustFor(deps.dataDir, values.judge, values.set, values.run);
  writeFileSync(path.join(deps.dataDir, "data/labels", `trust-${values.judge}.json`), JSON.stringify(t, null, 2) + "\n");
  for (const l of t.lines) deps.out(`${l.status.padEnd(13)} ${l.name}: ${l.value === null ? "—" : l.value.toFixed(2)} (n=${l.n}${l.low !== null ? `, ${l.low.toFixed(2)}–${l.high!.toFixed(2)}` : ""}) needs ${l.bar}`);
  deps.out(`judge ${values.judge}: ${t.trusted ? "TRUSTED" : "not trusted (judge-only critical blocks wait for a human)"} · ${t.answers_labeled} answers, ${t.claims_labeled} claims labeled`);
  return EXIT.OK;
};
