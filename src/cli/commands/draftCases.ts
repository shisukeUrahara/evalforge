import { existsSync } from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";
import { loadSlices } from "@/core/context/slices";
import { writeJsonl } from "@/core/dataset/jsonl";
import { DraftBatch, draftVars, QUOTA, toCases } from "@/core/dataset/draft";
import { lintCases } from "@/core/dataset/lint";
import { datasetDir } from "@/core/dataset/registry";
import type { Case, Category } from "@/core/domain/schemas";
import { renderMessages } from "@/core/llm/runner";
import { loadPromptFile } from "@/core/prompts/file";
import type { Command } from "../deps";
import { EXIT } from "../exit";

const CATEGORIES = Object.keys(QUOTA) as Category[];

/** Drafts the dataset: one drafter call per category, cached, then linted. */
export const draftCases: Command = async (argv, deps) => {
  const { values } = parseArgs({ args: argv, options: { dataset: { type: "string", default: "support-v1" }, "max-usd": { type: "string", default: "2" }, force: { type: "boolean", default: false } } });
  const file = path.join(datasetDir(deps.dataDir, values.dataset), "cases.jsonl");
  if (existsSync(file) && !values.force) {
    deps.err(`${file} exists. Pass --force to redraft (the cache makes a redraft free and identical).`);
    return EXIT.USAGE;
  }
  const role = deps.roles().drafter;
  const slices = loadSlices(deps.dataDir);
  const template = loadPromptFile(path.join(deps.dataDir, "data/prompts/drafter.v1.md"));
  const gateway = deps.makeGateway(Number(values["max-usd"]));
  const cases: Case[] = [];
  for (const [i, category] of CATEGORIES.entries()) {
    const messages = await renderMessages(template, draftVars(category, slices.values()));
    const res = await gateway.runStructured({ role, messages, schema: DraftBatch, schemaName: "draft_batch", arm: "draft", repeat: i });
    if (res.raw_text === null) throw new Error(`${category}: drafter returned no text (finish ${res.finish_reason}, refusal ${res.refusal})`);
    cases.push(...toCases(res.raw_text, category, cases.length + 1, role.spec));
    deps.out(`${category}: ${QUOTA[category]} cases${res.cached ? " (cached)" : ""}`);
  }
  writeJsonl(file, cases);
  const issues = lintCases(cases, slices);
  for (const i of issues) deps.err(`${i.level} ${i.case_id}: ${i.message}`);
  deps.out(`wrote ${cases.length} cases to ${path.relative(deps.dataDir, file)}; ${issues.filter((i) => i.level === "error").length} lint errors`);
  return issues.some((i) => i.level === "error") ? EXIT.CHECK_FAILED : EXIT.OK;
};
