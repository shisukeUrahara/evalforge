import type { Case, Category, Split } from "../domain/schemas";
import { mulberry32, shuffle } from "./rng";

/** Tuning cases per category (the rest go to holdout). 30 tuning / 50 holdout over 80 cases. */
export const TUNING_PER_CATEGORY: Record<Category, number> = { api_fact: 7, store_policy: 7, negative: 8, parity: 8 };

/**
 * Seeded split, stratified by category. Parity pairs move together, so both
 * halves of a pair are always in the same split.
 */
export function splitCases(cases: readonly Case[], seed: number, quota = TUNING_PER_CATEGORY): Record<string, Split> {
  const rng = mulberry32(seed);
  const out: Record<string, Split> = {};
  for (const category of Object.keys(quota) as Category[]) {
    const units = new Map<string, string[]>();
    for (const c of cases.filter((x) => x.category === category)) {
      const key = c.pair_id ?? c.id;
      units.set(key, [...(units.get(key) ?? []), c.id]);
    }
    let left = quota[category];
    for (const ids of shuffle([...units.values()], rng)) {
      const split: Split = left >= ids.length ? "tuning" : "holdout";
      if (split === "tuning") left -= ids.length;
      for (const id of ids) out[id] = split;
    }
    if (left !== 0) throw new Error(`cannot fill ${quota[category]} tuning cases for ${category}`);
  }
  return out;
}
