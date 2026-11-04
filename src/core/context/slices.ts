import { readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { canonicalJson, sha256Hex } from "../prompts/canonical";
import { loadPolicy } from "./northstar";

export interface Slice {
  id: string;
  title: string;
  text: string;
  source: "stripe" | "northstar";
}

export const StripeSlice = z.object({ id: z.string(), pointer: z.string(), title: z.string(), text: z.string() });
export const StripeManifest = z.object({
  repo: z.string(),
  commit: z.string().regex(/^[0-9a-f]{40}$/),
  path: z.string(),
  license: z.literal("MIT"),
  spec_sha256: z.string().regex(/^[0-9a-f]{64}$/),
  retrieved_at: z.string(),
  slices: z.array(z.object({ id: z.string(), pointer: z.string(), sha256: z.string() })),
});

export type PolicyVersion = "v1" | "v2";

/** Every slice a case may cite: the Stripe slices plus one version of the Northstar policy. */
export function loadSlices(dataDir: string, policy: PolicyVersion = "v1"): Map<string, Slice> {
  const stripe = z.array(StripeSlice).parse(JSON.parse(readFileSync(path.join(dataDir, "fixtures/stripe/slice.json"), "utf8")));
  const rules = loadPolicy(path.join(dataDir, `fixtures/northstar/policy_${policy}.md`));
  const all: Slice[] = [
    ...stripe.map((s) => ({ id: s.id, title: s.title, text: s.text, source: "stripe" as const })),
    ...rules.map((r) => ({ id: r.id, title: `Northstar ${r.id.slice(3)}: ${r.title} (SYNTHETIC)`, text: r.text, source: "northstar" as const })),
  ];
  return new Map(all.map((s) => [s.id, s]));
}

/** "ctx_" + 12 hex chars over the sorted (id, text) pairs: same slices and text, same ref. */
export function contextRef(slices: readonly Slice[]): string {
  const pairs = [...slices].sort((a, b) => (a.id < b.id ? -1 : 1)).map((s) => ({ id: s.id, text: s.text }));
  return `ctx_${sha256Hex(canonicalJson(pairs)).slice(0, 12)}`;
}
