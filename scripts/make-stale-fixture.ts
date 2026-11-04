/**
 * Writes runs/fixtures/stale-context: the context refs a baseline on policy v1
 * and a candidate on policy v2 would record for the tuning cases. No model calls.
 * Run: pnpm tsx scripts/make-stale-fixture.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { buildContext } from "@/core/context/build";
import { loadSlices } from "@/core/context/slices";
import { casesFor, loadDatasetManifest } from "@/core/dataset/manifest";
import { loadCases } from "@/core/dataset/registry";

const dataDir = process.cwd();
const manifest = loadDatasetManifest(dataDir, "support-v1");
const cases = casesFor(loadCases(dataDir, "support-v1"), manifest, "tuning");
const refs = (policy: "v1" | "v2") => {
  const slices = loadSlices(dataDir, policy);
  return Object.fromEntries(cases.map((c) => [c.id, buildContext(c.context_slice_ids, slices).ref]));
};
mkdirSync("runs/fixtures/stale-context", { recursive: true });
for (const [name, policy] of [["baseline", "v1"], ["candidate", "v2"]] as const) {
  writeFileSync(`runs/fixtures/stale-context/${name}.json`, JSON.stringify({ policy_version: policy, dataset_sha: manifest.dataset_sha, context_refs: refs(policy) }, null, 2) + "\n");
}
console.log("wrote runs/fixtures/stale-context/{baseline,candidate}.json");
