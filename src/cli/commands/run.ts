import path from "node:path";
import { parseArgs } from "node:util";
import { repoState } from "@/core/artifacts/git";
import { guardRun } from "@/core/artifacts/guard";
import type { RunManifest } from "@/core/artifacts/manifest";
import { runId, runsDir, writeRunFolder } from "@/core/artifacts/runs";
import { buildContext } from "@/core/context/build";
import { loadPolicy } from "@/core/context/northstar";
import { loadSlices, type PolicyVersion } from "@/core/context/slices";
import { actualUsd, loadPricing } from "@/core/cost/pricing";
import { casesFor, loadDatasetManifest } from "@/core/dataset/manifest";
import { loadCases } from "@/core/dataset/registry";
import { Split } from "@/core/domain/schemas";
import { resolveArms } from "@/core/run/arms";
import { droppedCases, runPaired } from "@/core/run/paired";
import type { Command } from "../deps";
import { EXIT } from "../exit";

const LIMITS =
  "Synthetic cases (LLM-drafted, model-reviewed). Temperature 0 with strict structured output. One provider family. Small N: report counts, not only rates.";

/** Runs baseline A and one candidate on a frozen split and writes runs/<id>/{manifest.json,outputs.jsonl}. */
export const run: Command = async (argv, deps) => {
  const { values } = parseArgs({
    args: argv,
    options: {
      split: { type: "string", default: "tuning" },
      dataset: { type: "string", default: "support-v1" },
      baseline: { type: "string", default: "A.v1" },
      candidate: { type: "string", default: "prompt:B.v1" },
      repeats: { type: "string" },
      policy: { type: "string", default: "v1" },
      "max-usd": { type: "string", default: "2" },
      "allow-dirty": { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
    },
  });
  const split = Split.parse(values.split);
  const repeats = Number(values.repeats ?? (split === "holdout" ? 3 : 1));
  const policy = values.policy as PolicyVersion;
  const state = repoState(deps.dataDir);
  guardRun(split, state, values["allow-dirty"]);

  const dsManifest = loadDatasetManifest(deps.dataDir, values.dataset);
  const cases = casesFor(loadCases(deps.dataDir, values.dataset), dsManifest, split);
  const slices = loadSlices(deps.dataDir, policy);
  const rules = new Map(loadPolicy(path.join(deps.dataDir, `fixtures/northstar/policy_${policy}.md`)).map((r) => [r.id, r]));
  const arms = resolveArms(deps.dataDir, deps.roles(), values.baseline, values.candidate);
  const calls = cases.length * arms.length * repeats;
  if (values["dry-run"]) {
    deps.out(`${split}: ${cases.length} cases x ${arms.length} arms (${arms.map((a) => a.arm).join(", ")}) x ${repeats} repeats = ${calls} calls; ${deps.replay ? "replay" : "live"} mode`);
    return EXIT.OK;
  }

  const gateway = deps.makeGateway(Number(values["max-usd"]));
  const rows = await runPaired({ cases, arms, repeats, slices, rules, gateway });
  const pricing = loadPricing(path.join(deps.dataDir, "pricing.json"));
  const created = deps.now();
  const id = runId(created, split, arms[1].arm);
  const manifest: RunManifest = {
    run_id: id,
    kind: "answers",
    created_at_utc: created.toISOString(),
    split,
    dataset: values.dataset,
    dataset_sha: dsManifest.dataset_sha,
    policy_version: policy,
    sample_count: cases.length,
    repetitions: repeats,
    concurrency: 4,
    arms: arms.map((a) => ({ arm: a.arm, prompt: a.prompt.name, prompt_sha: a.prompt.sha, model: a.role })),
    context_refs: Object.fromEntries(cases.map((c) => [c.id, buildContext(c.context_slice_ids, slices).ref])),
    git_sha: state.git_sha,
    git_dirty: state.git_dirty,
    allow_dirty: values["allow-dirty"],
    replay: deps.replay,
    cache_hits: rows.filter((r) => r.cached).length,
    cache_misses: rows.filter((r) => !r.cached && r.transport === null).length,
    usd: rows.filter((r) => !r.cached && r.transport === null).reduce((s, r) => s + actualUsd(pricing, arms.find((a) => a.arm === r.arm)!.role.spec, r.usage), 0),
    limitations: LIMITS,
  };
  writeRunFolder(path.join(runsDir(deps.dataDir), id), {
    "manifest.json": JSON.stringify(manifest, null, 2) + "\n",
    "outputs.jsonl": rows.map((r) => JSON.stringify(r)).join("\n") + "\n",
  });
  const dropped = droppedCases(rows);
  for (const a of arms) {
    const mine = rows.filter((r) => r.arm === a.arm && !dropped.has(r.case_id));
    const codes = new Map<string, number>();
    for (const r of mine) for (const k of [r.output_code, ...r.checks.map((c) => c.code)]) if (k !== "ok") codes.set(k, (codes.get(k) ?? 0) + 1);
    const clean = mine.filter((r) => r.output_code === "ok" && r.checks.length === 0).length;
    deps.out(`${a.arm} (${a.prompt.name}, ${a.role.spec}): ${clean}/${mine.length} answers pass deterministic checks${codes.size ? "; " + [...codes].map(([k, n]) => `${k} ${n}`).join(", ") : ""}`);
  }
  deps.out(`run ${id}: ${rows.length} answers, ${manifest.cache_hits} cached, ${dropped.size} cases dropped for transport, $${manifest.usd.toFixed(4)}`);
  return EXIT.OK;
};
