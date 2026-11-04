import { z } from "zod";
import { Case, Expected } from "../domain/schemas";

/** One reviewer decision on one drafted case. "fixed" carries only the fields that changed. */
export const CaseReview = z.object({
  case_id: z.string(),
  verdict: z.enum(["ok", "fixed"]),
  changes: z
    .object({
      question: z.string().optional(),
      context_slice_ids: z.array(z.string()).optional(),
      critical: z.boolean().optional(),
      expected: Expected.optional(),
    })
    .default({}),
  note: z.string(),
  reviewer: z.string(),
});
export type CaseReview = z.infer<typeof CaseReview>;

/**
 * Applies reviews to drafted cases. Every case needs exactly one review; a fix
 * must change something; the result must still be a valid Case.
 */
export function applyCaseReview(cases: readonly Case[], reviews: readonly CaseReview[]): { cases: Case[]; fixed: number; ok: number } {
  const byId = new Map<string, CaseReview>();
  for (const r of reviews) {
    if (byId.has(r.case_id)) throw new Error(`${r.case_id}: reviewed twice`);
    byId.set(r.case_id, r);
  }
  for (const id of byId.keys()) if (!cases.some((c) => c.id === id)) throw new Error(`${id}: review for an unknown case`);
  let fixed = 0;
  const out = cases.map((c) => {
    const r = byId.get(c.id);
    if (!r) throw new Error(`${c.id}: no review`);
    if (r.verdict === "ok") return Case.parse({ ...c, provenance: { ...c.provenance, reviewed_by: r.reviewer } });
    if (Object.keys(r.changes).length === 0) throw new Error(`${c.id}: verdict fixed but no changes`);
    fixed++;
    return Case.parse({ ...c, ...r.changes, provenance: { ...c.provenance, reviewed_by: r.reviewer } });
  });
  return { cases: out, fixed, ok: cases.length - fixed };
}
