import { parseArgs } from "node:util";
import { RunManifest } from "@/core/artifacts/manifest";
import { readRunFile } from "@/core/artifacts/runs";
import { loadRules } from "@/core/gate/evaluate";
import { addConfirm, addWaiver } from "@/core/gate/logs";
import { loadPrompt } from "@/core/prompts/registry";
import type { Command } from "../deps";
import { EXIT } from "../exit";

function runInfo(dataDir: string, run: string | undefined) {
  const text = run ? readRunFile(dataDir, run, "manifest.json") : null;
  return text ? RunManifest.parse(JSON.parse(text)) : null;
}

/** ef waive --run <id> --check regression_count --reason "..." --as lee */
export const waive: Command = async (argv, deps) => {
  const { values } = parseArgs({ args: argv, options: { run: { type: "string" }, check: { type: "string", default: "regression_count" }, reason: { type: "string" }, as: { type: "string", default: "maya" }, judge: { type: "string", default: "claims.v1" } } });
  const m = runInfo(deps.dataDir, values.run);
  const gate = values.run ? readRunFile(deps.dataDir, values.run, "gate.json") : null;
  if (!m || !gate || !values.reason) {
    deps.err('usage: ef waive --run <gated run id> --check regression_count --reason "why" --as lee');
    return EXIT.USAGE;
  }
  const check = (JSON.parse(gate).checks as { id: string; case_ids: string[] }[]).find((c) => c.id === values.check);
  if (!check) throw new Error(`no check ${values.check} in gate.json`);
  const cand = m.arms[1];
  const w = addWaiver(deps.dataDir, {
    check_id: values.check,
    candidate_prompt_sha: cand.prompt_sha,
    candidate_model_spec: cand.model.spec,
    dataset_sha: m.dataset_sha,
    rules_sha: loadRules(deps.dataDir).sha,
    judge_sha: loadPrompt(deps.dataDir, values.judge, "judge").sha,
    failing_case_ids: check.case_ids,
    reason: values.reason,
    approver: values.as,
    at: deps.now().toISOString(),
  });
  deps.out(`waiver recorded for ${w.check_id} on ${w.failing_case_ids.length} case(s) by ${w.approver}. Run ef gate again to apply it.`);
  return EXIT.OK;
};

/** ef confirm --run <id> --case c014 --decision unsupported --as lee */
export const confirm: Command = async (argv, deps) => {
  const { values } = parseArgs({ args: argv, options: { run: { type: "string" }, case: { type: "string" }, decision: { type: "string", default: "unsupported" }, as: { type: "string", default: "maya" } } });
  if (!runInfo(deps.dataDir, values.run) || !values.case || !["unsupported", "not_unsupported"].includes(values.decision)) {
    deps.err("usage: ef confirm --run <run id> --case <case id> --decision unsupported|not_unsupported --as lee");
    return EXIT.USAGE;
  }
  addConfirm(deps.dataDir, { run_id: values.run!, check_id: "critical_unsupported_claim", case_id: values.case, decision: values.decision as "unsupported" | "not_unsupported", by: values.as, at: deps.now().toISOString() });
  deps.out(`confirm recorded: ${values.case} is ${values.decision} (by ${values.as}). Run ef gate again.`);
  return EXIT.OK;
};

