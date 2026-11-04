import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { RunManifest } from "@/core/artifacts/manifest";
import { readRunFile } from "@/core/artifacts/runs";
import { buildContext } from "@/core/context/build";
import { loadSlices } from "@/core/context/slices";
import { appendJsonl } from "@/core/dataset/jsonl";
import { loadCases } from "@/core/dataset/registry";
import { JudgmentRow } from "@/core/judge/runner";
import { parseSheet, renderSheet, sampleForLabels, SheetKey } from "@/core/labels/sheet";
import { OutputRow } from "@/core/run/paired";
import type { Command } from "../deps";
import { EXIT } from "../exit";

const SHEETS = "data/labels/sheets";

/** Writes a blind label sheet for one run's judged answers (and a key the labeler does not need to open). */
export const labelSheet: Command = async (argv, deps) => {
  const { values } = parseArgs({ args: argv, options: { run: { type: "string" }, set: { type: "string", default: "tuning" }, n: { type: "string", default: "20" }, judge: { type: "string", default: "claims.v1" } } });
  const mText = values.run ? readRunFile(deps.dataDir, values.run, "manifest.json") : null;
  const jText = values.run ? readRunFile(deps.dataDir, values.run, `judgments-${values.judge}.jsonl`) : null;
  if (!values.run || !mText || !jText) {
    deps.err("usage: ef label-sheet --run <judged run id> [--set tuning] [--n 20]");
    return EXIT.USAGE;
  }
  const sheetFile = path.join(deps.dataDir, SHEETS, `${values.set}.md`);
  if (existsSync(sheetFile)) {
    deps.err(`${path.relative(deps.dataDir, sheetFile)} exists. Fill it in, or delete it to resample.`);
    return EXIT.USAGE;
  }
  const manifest = RunManifest.parse(JSON.parse(mText));
  const outputs = readRunFile(deps.dataDir, values.run, "outputs.jsonl")!.trim().split("\n").map((l) => OutputRow.parse(JSON.parse(l)));
  const judgments = jText.trim().split("\n").map((l) => JudgmentRow.parse(JSON.parse(l)));
  const cands = judgments
    .filter((j) => j.output !== null && j.output.claims.length > 0)
    .map((j) => ({ run_id: values.run!, case_id: j.case_id, arm: j.arm, repeat: j.repeat, judgment: j.output!, answer: outputs.find((o) => o.case_id === j.case_id && o.arm === j.arm && o.repeat === j.repeat)!.output!.answer }));
  const items = sampleForLabels(cands, Number(values.n), 20261104);
  const cases = new Map(loadCases(deps.dataDir, manifest.dataset).map((c) => [c.id, c]));
  const slices = loadSlices(deps.dataDir, manifest.policy_version);
  writeFileSync(sheetFile.replace(/\.md$/, ".key.json"), JSON.stringify(Object.fromEntries(items.map((i) => [i.item, { run_id: values.run, case_id: i.c.case_id, arm: i.c.arm, repeat: i.c.repeat, random_half: i.random_half, claims: i.c.judgment.claims.length }])), null, 2) + "\n");
  writeFileSync(sheetFile, renderSheet(items, cases, (id) => buildContext(cases.get(id)!.context_slice_ids, slices).text));
  deps.out(`wrote ${items.length} answers (${items.filter((i) => !i.random_half).length} judge-flagged, ${items.filter((i) => i.random_half).length} random) to ${path.relative(deps.dataDir, sheetFile)}`);
  return EXIT.OK;
};

/** Reads a filled sheet and appends its labels to data/labels/claims.jsonl. */
export const applyLabels: Command = async (argv, deps) => {
  const { values } = parseArgs({ args: argv, options: { sheet: { type: "string" }, labeler: { type: "string", default: "owner" } } });
  if (!values.sheet) {
    deps.err("usage: ef apply-labels --sheet data/labels/sheets/tuning.md");
    return EXIT.USAGE;
  }
  const key = SheetKey.parse(JSON.parse(readFileSync(values.sheet.replace(/\.md$/, ".key.json"), "utf8")));
  const { labels, problems } = parseSheet(readFileSync(values.sheet, "utf8"), key, values.labeler, deps.now().toISOString());
  for (const p of problems) deps.err(p);
  if (problems.length) {
    deps.err(`${problems.length} problem(s); nothing applied.`);
    return EXIT.CHECK_FAILED;
  }
  for (const l of labels) appendJsonl(path.join(deps.dataDir, "data/labels/claims.jsonl"), l);
  deps.out(`${labels.length}/${Object.keys(key).length} applied`);
  return EXIT.OK;
};
