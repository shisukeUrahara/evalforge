import { expect, test } from "vitest";
import type { Case, Category } from "../domain/schemas";
import { splitCases } from "./split";

function make(category: Category, n: number, start: number, pairs = false): Case[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `c${String(start + i).padStart(3, "0")}`,
    category,
    question: "question text",
    context_slice_ids: ["ns:NS-R1"],
    critical: false,
    ...(pairs ? { pair_id: `p${String(Math.floor(i / 2) + 1).padStart(2, "0")}` } : {}),
    expected: { must_refuse: false },
    provenance: { drafted_by: "test" },
  }));
}

const cases = [...make("api_fact", 20, 1), ...make("store_policy", 20, 21), ...make("negative", 20, 41), ...make("parity", 20, 61, true)];

test("30 tuning / 50 holdout with exact per-category counts", () => {
  const s = splitCases(cases, 42);
  const count = (cat: Category, split: string) => cases.filter((c) => c.category === cat && s[c.id] === split).length;
  expect(Object.values(s).filter((x) => x === "tuning")).toHaveLength(30);
  expect([count("api_fact", "tuning"), count("store_policy", "tuning"), count("negative", "tuning"), count("parity", "tuning")]).toEqual([7, 7, 8, 8]);
});

test("pairs stay together and the seed decides", () => {
  const s = splitCases(cases, 42);
  for (const c of cases.filter((x) => x.pair_id)) {
    const twin = cases.find((x) => x.pair_id === c.pair_id && x.id !== c.id)!;
    expect(s[c.id]).toBe(s[twin.id]);
  }
  expect(splitCases(cases, 42)).toEqual(s);
  expect(splitCases(cases, 7)).not.toEqual(s);
});
