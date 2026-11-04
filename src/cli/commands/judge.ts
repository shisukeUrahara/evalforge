import path from "node:path";
import { parseArgs } from "node:util";
import { readRunFile, runsDir } from "@/core/artifacts/runs";
import { RunManifest } from "@/core/artifacts/manifest";
import { loadSlices } from "@/core/context/slices";
import { actualUsd, loadPricing } from "@/core/cost/pricing";
import { writeJsonl } from "@/core/dataset/jsonl";
import { loadCases } from "@/core/dataset/registry";
import { unsupportedMaterial } from "@/core/judge/claims";
import { judgeOutputs } from "@/core/judge/runner";
import { loadPrompt } from "@/core/prompts/registry";
import { OutputRow } from "@/core/run/paired";
import type { Command } from "../deps";
import { EXIT } from "../exit";

/** Judges a run's answers and writes runs/<id>/judgments-<judge>.jsonl. */
export const judge: Command = async (argv, deps) => {
  const { values } = parseArgs({ args: argv, options: { run: { type: "string" }, judge: { type: "string", default: "claims.v1" }, "max-usd": { type: "string", default: "2" } } });
  const manifestText = values.run ? readRunFile(deps.dataDir, values.run, "manifest.json") : null;
  if (!values.run || !manifestText) {
    deps.err("usage: ef judge --run <run id> [--judge claims.v1]");
    return EXIT.USAGE;
  }
  const manifest = RunManifest.parse(JSON.parse(manifestText));
  const rows = readRunFile(deps.dataDir, values.run, "outputs.jsonl")!.trim().split("\n").map((l) => OutputRow.parse(JSON.parse(l)));
  const role = deps.roles().judge;
  const prompt = loadPrompt(deps.dataDir, values.judge, "judge");
  const judged = await judgeOutputs({
    rows,
    cases: new Map(loadCases(deps.dataDir, manifest.dataset).map((c) => [c.id, c])),
    slices: loadSlices(deps.dataDir, manifest.policy_version),
    prompt,
    role,
    gateway: deps.makeGateway(Number(values["max-usd"])),
  });
  writeJsonl(path.join(runsDir(deps.dataDir), values.run, `judgments-${prompt.name}.jsonl`), judged);
  const pricing = loadPricing(path.join(deps.dataDir, "pricing.json"));
  const usd = judged.filter((j) => !j.cached).reduce((s, j) => s + actualUsd(pricing, role.spec, j.usage), 0);
  for (const arm of manifest.arms.map((a) => a.arm)) {
    const mine = judged.filter((j) => j.arm === arm);
    const ok = mine.filter((j) => j.output !== null);
    const unsupported = ok.reduce((s, j) => s + unsupportedMaterial(j.output!), 0);
    deps.out(`${arm}: ${ok.length} judged, ${mine.length - ok.length} judge_error, ${unsupported} unsupported material claims (${(unsupported / Math.max(1, ok.length)).toFixed(2)} per answer)`);
  }
  deps.out(`judge ${prompt.name} on ${values.run}: ${judged.filter((j) => j.cached).length} cached, $${usd.toFixed(4)}`);
  return EXIT.OK;
};
