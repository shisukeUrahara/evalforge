import { expect, test } from "vitest";
import { comparisonView } from "./comparison";
import { gateView } from "./gate";
import { judgeView } from "./judge";

const cwd = process.cwd();

test("gate view: candidates B, M, C with their decisions; tiers in order; version strip", () => {
  const v = gateView(cwd)!;
  expect(v.candidates.map((c) => [c.arm, c.decision])).toEqual([
    ["B", "block"],
    ["M", "ship"],
    ["C", "block"],
  ]);
  expect(v.selected.arm).toBe("B");
  expect(v.tiers.map((t) => t.tier)).toEqual(["critical", "priority", "warn"]);
  expect(v.what_changed).toBe("prompt A.v1 → B.v1");
  expect(gateView(cwd, "M")!.what_changed).toMatch(/^model openai:gpt-4.1-mini.* → openai:gpt-4o-mini/);
  expect(v.version.models).toEqual(["openai:gpt-4.1-mini-2025-04-14"]);
});

test("comparison view: picks a regression first; both answers, sources and a prompt diff", () => {
  const v = comparisonView(cwd, gateView(cwd)!.selected.run_id);
  expect(v.rows).toHaveLength(50);
  expect(v.rows.filter((r) => r.regression).length).toBe(8);
  expect(v.selected!.baseline.arm).toBe("A");
  expect(v.selected!.candidate.arm).toBe("B");
  expect(v.selected!.sources.length).toBeGreaterThan(0);
  expect(v.prompt_diff.some((l) => l.op === "+")).toBe(true);
  expect(comparisonView(cwd, gateView(cwd, "M")!.selected.run_id).prompt_diff).toEqual([]);
});

test("judge view: canaries measured; labels pending until the owner labels", () => {
  const v = judgeView(cwd);
  expect(v.canaries.map((c) => [c.set, c.caught, c.total])).toEqual([
    ["tuning", 10, 10],
    ["holdout", 30, 30],
  ]);
  expect(v.trust.confusion).toHaveLength(3);
});
