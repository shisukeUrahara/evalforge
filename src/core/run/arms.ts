import type { ModelRoles } from "../llm/config";
import { loadPrompt } from "../prompts/registry";
import type { ArmInput } from "./paired";

/**
 * Baseline arm "A" plus one candidate:
 *   prompt:B.v1  -> arm "B", new prompt, same model
 *   model:swap   -> arm "M", baseline prompt, the swap model role
 *   null         -> arm "A2", baseline prompt and model again (noise floor)
 */
export function resolveArms(dataDir: string, roles: ModelRoles, baseline: string, candidate: string): [ArmInput, ArmInput] {
  const base: ArmInput = { arm: "A", prompt: loadPrompt(dataDir, baseline), role: roles.answer };
  if (candidate === "null") return [base, { ...base, arm: "A2" }];
  if (candidate === "model:swap") return [base, { arm: "M", prompt: base.prompt, role: roles.swap }];
  const m = candidate.match(/^prompt:(([A-Z])\.v\d+)$/);
  if (!m || m[2] === "A") throw new Error(`--candidate must be prompt:<X>.v<n> (X not A), model:swap or null; got "${candidate}"`);
  return [base, { arm: m[2], prompt: loadPrompt(dataDir, m[1]), role: roles.answer }];
}
