import { existsSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { loadSlices } from "@/core/context/slices";
import { lintCases } from "@/core/dataset/lint";
import { buildManifest } from "@/core/dataset/manifest";
import { datasetDir, loadCases } from "@/core/dataset/registry";
import { splitCases } from "@/core/dataset/split";
import type { Command } from "../deps";
import { EXIT } from "../exit";

/** Splits the dataset 30/50 with a fixed seed and freezes it with hashes. Refuses to refreeze. */
export const freezeSplit: Command = async (argv, deps) => {
  const { values } = parseArgs({ args: argv, options: { dataset: { type: "string", default: "support-v1" }, seed: { type: "string", default: "20261104" } } });
  const file = path.join(datasetDir(deps.dataDir, values.dataset), "manifest.json");
  if (existsSync(file)) {
    deps.err(`${path.relative(deps.dataDir, file)} exists: the split is frozen. Delete it only if no run has used it.`);
    return EXIT.USAGE;
  }
  const cases = loadCases(deps.dataDir, values.dataset);
  const split = splitCases(cases, Number(values.seed));
  const issues = lintCases(cases, loadSlices(deps.dataDir), split).filter((i) => i.level === "error");
  for (const i of issues) deps.err(`${i.case_id}: ${i.message}`);
  if (issues.length) return EXIT.CHECK_FAILED;
  const manifest = buildManifest(values.dataset, cases, split, Number(values.seed));
  writeFileSync(file, JSON.stringify(manifest, null, 2) + "\n");
  deps.out(`frozen: ${manifest.counts.tuning} tuning / ${manifest.counts.holdout} holdout, holdout_sha ${manifest.holdout_sha.slice(0, 12)}`);
  return EXIT.OK;
};
