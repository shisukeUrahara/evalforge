import path from "node:path";
import { parseArgs } from "node:util";
import { RunManifest } from "@/core/artifacts/manifest";
import { readRunFile } from "@/core/artifacts/runs";
import { buildCanaries, caught, Canary } from "@/core/canary/build";
import { buildContext } from "@/core/context/build";
import { loadSlices } from "@/core/context/slices";
import { readJsonl, writeJsonl } from "@/core/dataset/jsonl";
import { loadCases } from "@/core/dataset/registry";
import { judgeOutputs } from "@/core/judge/runner";
import { loadPrompt } from "@/core/prompts/registry";
import { OutputRow } from "@/core/run/paired";
import type { Command } from "../deps";
import { EXIT } from "../exit";

/** Builds canaries from a run's clean answers (once, then frozen) and judges them. */
export const canaries: Command = async (argv, deps) => {
  const { values } = parseArgs({ args: argv, options: { run: { type: "string" }, set: { type: "string", default: "tuning" }, n: { type: "string", default: "10" }, judge: { type: "string", default: "claims.v1" }, "max-usd": { type: "string", default: "1" } } });
  const mText = values.run ? readRunFile(deps.dataDir, values.run, "manifest.json") : null;
  if (!values.run || !mText) {
    deps.err("usage: ef canaries --run <run id> [--set tuning] [--n 10] [--judge claims.v1]");
    return EXIT.USAGE;
  }
  const manifest = RunManifest.parse(JSON.parse(mText));
  const cases = new Map(loadCases(deps.dataDir, manifest.dataset).map((c) => [c.id, c]));
  const slices = loadSlices(deps.dataDir, manifest.policy_version);
  const file = path.join(deps.dataDir, "data/canaries", `${values.set}.jsonl`);
  let set = readJsonl(file, Canary);
  if (set.length === 0) {
    const rows = readRunFile(deps.dataDir, values.run, "outputs.jsonl")!.trim().split("\n").map((l) => OutputRow.parse(JSON.parse(l)));
    set = buildCanaries(rows.filter((r) => r.arm === "A"), (id) => buildContext(cases.get(id)!.context_slice_ids, slices).text, Number(values.n), 20261104, `${values.set[0]}k`);
    writeJsonl(file, set);
    deps.out(`built ${set.length} canaries in ${path.relative(deps.dataDir, file)}`);
  }
  // Judge each canary answer exactly like a real answer, under its own arm slot.
  const asRows = set.map((c) => ({ case_id: c.case_id, arm: `canary-${c.canary_id}`, repeat: 0, output: { answer: c.answer, cited_source_ids: [], refused: false, refusal_reason: null } }) as unknown as OutputRow);
  const prompt = loadPrompt(deps.dataDir, values.judge, "judge");
  const judged = await judgeOutputs({ rows: asRows, cases, slices, prompt, role: deps.roles().judge, gateway: deps.makeGateway(Number(values["max-usd"])) });
  const results = set.map((c, i) => ({ canary_id: c.canary_id, kind: c.kind, injected_value: c.injected_value, judge: prompt.name, status: judged[i].status, caught: c.kind === "control" ? null : caught(c, judged[i].output), output: judged[i].output }));
  writeJsonl(path.join(deps.dataDir, "data/canaries", `${values.set}.${prompt.name}.results.jsonl`), results);
  const real = results.filter((r) => r.kind !== "control");
  deps.out(`${prompt.name}: caught ${real.filter((r) => r.caught).length}/${real.length} canaries`);
  return EXIT.OK;
};
