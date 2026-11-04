import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { StripeManifest, StripeSlice } from "./slices";

/** Checks the committed sources against their manifests. Returns problems; empty means all good. */
export function verifySources(dataDir: string): string[] {
  const problems: string[] = [];
  const read = (p: string) => readFileSync(path.join(dataDir, p), "utf8");
  const manifest = StripeManifest.parse(JSON.parse(read("fixtures/stripe/source_manifest.json")));
  const slices = z.array(StripeSlice).parse(JSON.parse(read("fixtures/stripe/slice.json")));
  const byId = new Map(slices.map((s) => [s.id, s]));
  for (const m of manifest.slices) {
    const s = byId.get(m.id);
    if (!s) problems.push(`${m.id}: in the manifest but not in slice.json`);
    else if (createHash("sha256").update(s.text).digest("hex") !== m.sha256) problems.push(`${m.id}: text does not match its checksum`);
  }
  for (const s of slices) if (!manifest.slices.some((m) => m.id === s.id)) problems.push(`${s.id}: not in the manifest`);
  for (const v of ["v1", "v2"]) {
    if (!/^SYNTHETIC\./m.test(read(`fixtures/northstar/policy_${v}.md`))) problems.push(`policy_${v}.md: missing SYNTHETIC notice`);
  }
  return problems;
}
