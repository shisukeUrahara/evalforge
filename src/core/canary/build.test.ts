import { expect, test } from "vitest";
import type { OutputRow } from "../run/paired";
import { buildCanaries, caught } from "./build";

const row = (case_id: string, answer: string) => ({ case_id, arm: "A", repeat: 0, checks: [], output: { answer, cited_source_ids: [], refused: false, refusal_reason: null } }) as unknown as OutputRow;
const rows = [row("c023", "You can return it within 1 year of delivery."), row("c002", "Use the charge parameter."), row("c004", "Pick a reason.")];

test("swaps a stated value or adds one fabricated sentence; injected values are not in the context", () => {
  const cs = buildCanaries(rows, () => "context about refunds and 1 year", 3, 1, "t");
  expect(cs).toHaveLength(3);
  const swapped = cs.find((c) => c.case_id === "c023")!;
  expect(swapped).toMatchObject({ kind: "changed_number", injected_value: "3 years", answer: "You can return it within 3 years of delivery." });
  for (const c of cs.filter((x) => x.kind === "added_claim")) expect(c.answer.startsWith(c.original_answer)).toBe(true);
  expect(new Set(cs.map((c) => c.canary_id)).size).toBe(3);
});

test("a canary is caught only by an unsupported claim holding the injected value", () => {
  const c = buildCanaries(rows, () => "", 1, 1, "t")[0];
  const claim = (text: string, verdict: "supported" | "unsupported") => ({ text, kind: "api_fact" as const, material: true, attributed_to: "stripe" as const, verdict, evidence_id: null });
  expect(caught(c, { claims: [claim(`It is ${c.injected_value}.`, "unsupported")], relevance: 4 })).toBe(true);
  expect(caught(c, { claims: [claim(`It is ${c.injected_value}.`, "supported")], relevance: 4 })).toBe(false);
  expect(caught(c, { claims: [claim("Something else entirely.", "unsupported")], relevance: 4 })).toBe(false);
  expect(caught(c, null)).toBe(false);
});
