import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import type { Case, Split } from "../domain/schemas";
import { canonicalJson, sha256Hex } from "../prompts/canonical";
import { datasetDir, datasetSha } from "./registry";

export const DatasetManifest = z.object({
  dataset: z.string(),
  dataset_sha: z.string().regex(/^[0-9a-f]{64}$/),
  seed: z.number().int(),
  counts: z.object({ tuning: z.number().int(), holdout: z.number().int() }),
  /** Hash of the holdout cases. Frozen before any tuning; a later change to them is visible. */
  holdout_sha: z.string().regex(/^[0-9a-f]{64}$/),
  split: z.record(z.string(), z.enum(["tuning", "holdout"])),
});
export type DatasetManifest = z.infer<typeof DatasetManifest>;

export function buildManifest(dataset: string, cases: readonly Case[], split: Record<string, Split>, seed: number): DatasetManifest {
  const holdout = cases.filter((c) => split[c.id] === "holdout");
  return {
    dataset,
    dataset_sha: datasetSha(cases),
    seed,
    counts: { tuning: cases.length - holdout.length, holdout: holdout.length },
    holdout_sha: sha256Hex(canonicalJson(holdout)),
    split,
  };
}

export function loadDatasetManifest(dataDir: string, dataset: string): DatasetManifest {
  return DatasetManifest.parse(JSON.parse(readFileSync(path.join(datasetDir(dataDir, dataset), "manifest.json"), "utf8")));
}

/** Cases of one split, after checking the dataset still matches its frozen manifest. */
export function casesFor(cases: readonly Case[], manifest: DatasetManifest, split: Split): Case[] {
  if (datasetSha(cases) !== manifest.dataset_sha) throw new Error("cases.jsonl changed since the split was frozen (dataset_sha differs)");
  return cases.filter((c) => manifest.split[c.id] === split);
}
