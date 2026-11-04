import type { Case, Split } from "../domain/schemas";
import type { Slice } from "../context/slices";

export interface LintIssue {
  level: "error" | "warn";
  case_id: string;
  message: string;
}

const words = (s: string) => s.toLowerCase().match(/[a-z0-9$%]+/g) ?? [];
function shingles(s: string, n = 3): Set<string> {
  const w = words(s);
  const out = new Set<string>();
  for (let i = 0; i + n <= w.length; i++) out.add(w.slice(i, i + n).join(" "));
  return out;
}
export function jaccard(a: string, b: string): number {
  const x = shingles(a);
  const y = shingles(b);
  if (x.size === 0 && y.size === 0) return 1;
  let inter = 0;
  for (const s of x) if (y.has(s)) inter++;
  return inter / (x.size + y.size - inter);
}

/**
 * Structural checks on a dataset. Errors make it unusable; warnings are shown.
 * Near-duplicates across tuning/holdout are leakage, flagged at Jaccard >= 0.8
 * on word 3-shingles (parity twins are allowed to be near-identical).
 */
export function lintCases(cases: readonly Case[], slices: ReadonlyMap<string, Slice>, split?: Record<string, Split>): LintIssue[] {
  const issues: LintIssue[] = [];
  const err = (case_id: string, message: string) => issues.push({ level: "error", case_id, message });
  const seen = new Set<string>();
  for (const c of cases) {
    if (seen.has(c.id)) err(c.id, "duplicate id");
    seen.add(c.id);
    for (const id of c.context_slice_ids) if (!slices.has(id)) err(c.id, `unknown slice ${id}`);
    for (const id of c.expected.must_cite ?? []) if (!c.context_slice_ids.includes(id)) err(c.id, `must_cite ${id} is not in its context`);
    const rule = c.expected.must_match_rule;
    if (rule && !c.context_slice_ids.includes(`ns:${rule}`)) err(c.id, `must_match_rule ${rule} is not in its context`);
    if (c.category === "parity" && !c.pair_id) err(c.id, "parity case without pair_id");
    if (c.category !== "parity" && c.pair_id) err(c.id, "pair_id on a non-parity case");
    if (c.category === "negative" && !c.expected.must_refuse && !c.expected.not_a_stripe_fact) {
      issues.push({ level: "warn", case_id: c.id, message: "negative case that neither must refuse nor checks Stripe attribution" });
    }
  }
  const pairs = new Map<string, Case[]>();
  for (const c of cases) if (c.pair_id) pairs.set(c.pair_id, [...(pairs.get(c.pair_id) ?? []), c]);
  for (const [id, members] of pairs) {
    if (members.length !== 2) err(members[0].id, `pair ${id} has ${members.length} cases, needs 2`);
    else if (members[0].expected.must_refuse !== members[1].expected.must_refuse) err(members[0].id, `pair ${id} halves expect different refusals`);
  }
  for (let i = 0; i < cases.length; i++) {
    for (let j = i + 1; j < cases.length; j++) {
      const [a, b] = [cases[i], cases[j]];
      if (a.pair_id && a.pair_id === b.pair_id) continue;
      if (jaccard(a.question, b.question) < 0.8) continue;
      const leak = split && split[a.id] !== split[b.id];
      issues.push({ level: leak ? "error" : "warn", case_id: a.id, message: `${leak ? "leak: " : ""}near-duplicate of ${b.id}` });
    }
  }
  return issues;
}
