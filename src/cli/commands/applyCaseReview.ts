import path from "node:path";
import { parseArgs } from "node:util";
import { loadSlices } from "@/core/context/slices";
import { readJsonl, writeJsonl } from "@/core/dataset/jsonl";
import { lintCases } from "@/core/dataset/lint";
import { datasetDir, loadCases } from "@/core/dataset/registry";
import { applyCaseReview, CaseReview } from "@/core/dataset/review";
import type { Command } from "../deps";
import { EXIT } from "../exit";

/** Applies a case review file (JSONL of CaseReview) to the dataset and keeps the review log. */
export const applyCaseReviewCmd: Command = async (argv, deps) => {
  const { values } = parseArgs({ args: argv, options: { dataset: { type: "string", default: "support-v1" }, file: { type: "string" } } });
  if (!values.file) {
    deps.err("usage: ef apply-case-review --file <reviews.jsonl>");
    return EXIT.USAGE;
  }
  const reviews = readJsonl(path.resolve(values.file), CaseReview);
  const { cases, fixed, ok } = applyCaseReview(loadCases(deps.dataDir, values.dataset), reviews);
  const issues = lintCases(cases, loadSlices(deps.dataDir));
  for (const i of issues) deps.err(`${i.level} ${i.case_id}: ${i.message}`);
  if (issues.some((i) => i.level === "error")) return EXIT.CHECK_FAILED;
  writeJsonl(path.join(datasetDir(deps.dataDir, values.dataset), "cases.jsonl"), cases);
  writeJsonl(path.join(deps.dataDir, "data/labels/cases.jsonl"), reviews);
  deps.out(`${ok} ok, ${fixed} fixed; review log in data/labels/cases.jsonl`);
  return EXIT.OK;
};
