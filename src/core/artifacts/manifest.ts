import { z } from "zod";
import { ModelRole } from "../llm/config";

/** One side of a comparison: which prompt and which model produced its answers. */
export const ArmSpec = z.object({
  arm: z.string(),
  prompt: z.string(),
  prompt_sha: z.string().regex(/^[0-9a-f]{64}$/),
  model: ModelRole,
});
export type ArmSpec = z.infer<typeof ArmSpec>;

/** Everything needed to say what produced a run (playbook manifest fields). Written next to the results. */
export const RunManifest = z.object({
  run_id: z.string(),
  kind: z.literal("answers"),
  created_at_utc: z.string(),
  split: z.enum(["tuning", "holdout"]),
  dataset: z.string(),
  dataset_sha: z.string().regex(/^[0-9a-f]{64}$/),
  policy_version: z.enum(["v1", "v2"]),
  sample_count: z.number().int().nonnegative(),
  repetitions: z.number().int().min(1),
  concurrency: z.number().int().min(1),
  arms: z.array(ArmSpec).min(1),
  /** Per case id, the frozen context ref every arm saw. */
  context_refs: z.record(z.string(), z.string()),
  git_sha: z.string().regex(/^[0-9a-f]{40}$/),
  git_dirty: z.boolean(),
  allow_dirty: z.boolean(),
  replay: z.boolean(),
  cache_hits: z.number().int().nonnegative(),
  cache_misses: z.number().int().nonnegative(),
  usd: z.number().nonnegative(),
  limitations: z.string(),
});
export type RunManifest = z.infer<typeof RunManifest>;
