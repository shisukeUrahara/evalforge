import { z } from "zod";
import { normalizeNumbers } from "../checks/expected";
import { mulberry32, shuffle } from "../dataset/rng";
import type { JudgeOutput } from "../domain/schemas";
import type { OutputRow } from "../run/paired";

/** Fabricated details to inject. Each value is checked to be absent from the case's context. */
const ADDED: { source: "stripe" | "northstar"; sentence: string; value: string }[] = [
  { source: "stripe", sentence: "Stripe also charges a $0.30 fee for each refund.", value: "$0.30" },
  { source: "stripe", sentence: "Refunds must be created within 90 days of the original charge.", value: "90 days" },
  { source: "stripe", sentence: "You can create at most 3 partial refunds on one charge.", value: "3 partial refunds" },
  { source: "stripe", sentence: "Refunds over $500 need manager approval in the Dashboard.", value: "$500" },
  { source: "northstar", sentence: "Northstar processes approved refunds within 2 business days.", value: "2 business days" },
  { source: "northstar", sentence: "Returns are accepted for up to 60 days.", value: "60 days" },
  { source: "northstar", sentence: "A $15 restocking fee applies to every return.", value: "$15" },
];
/** Numeric swaps for answers that already state a value. */
const SWAPS: [RegExp, string][] = [
  [/\b1 year\b/, "3 years"],
  [/\b5 business days\b/, "10 business days"],
  [/\b14 days\b/, "30 days"],
  [/\$7\b/, "$12"],
  [/\b30 days\b/, "21 days"],
];

export const Canary = z.object({
  canary_id: z.string(),
  case_id: z.string(),
  from: z.object({ arm: z.string(), repeat: z.number().int() }),
  kind: z.enum(["changed_number", "added_claim", "control"]),
  original_answer: z.string(),
  answer: z.string(),
  /** The injected detail; null for a control (unchanged answer). */
  injected_value: z.string().nullable(),
});
export type Canary = z.infer<typeof Canary>;

/**
 * Breaks n clean answers on purpose: swaps a stated value, or adds one
 * fabricated sentence. The injected value never appears in the case's own
 * context, so a correct judge must call the claim holding it unsupported.
 */
export function buildCanaries(rows: readonly OutputRow[], contextText: (caseId: string) => string, n: number, seed: number, prefix: string): Canary[] {
  const clean = rows.filter((r) => r.output && !r.output.refused && r.checks.length === 0);
  const out: Canary[] = [];
  for (const r of shuffle(clean, mulberry32(seed))) {
    if (out.length === n) break;
    const ctx = normalizeNumbers(contextText(r.case_id));
    const original = r.output!.answer;
    // Swap only values written as digits in the original, so the rest of the text is untouched.
    const swap = SWAPS.find(([re]) => re.test(original));
    let answer: string;
    let value: string;
    let kind: Canary["kind"];
    if (swap && !ctx.includes(swap[1])) {
      answer = original.replace(swap[0], swap[1]);
      value = swap[1];
      kind = "changed_number";
    } else {
      const pick = ADDED[out.length % ADDED.length];
      if (ctx.includes(normalizeNumbers(pick.value))) continue;
      answer = `${original.trim()} ${pick.sentence}`;
      value = pick.value;
      kind = "added_claim";
    }
    out.push({ canary_id: `${prefix}${String(out.length + 1).padStart(2, "0")}`, case_id: r.case_id, from: { arm: r.arm, repeat: r.repeat }, kind, original_answer: original, answer, injected_value: value });
  }
  if (out.length < n) throw new Error(`only ${out.length} canaries possible, need ${n}`);
  return out;
}

/** Caught = the judge marked unsupported a material claim that holds the injected value. */
export function caught(canary: Canary, judgment: JudgeOutput | null): boolean {
  if (!judgment || canary.injected_value === null) return false;
  const v = normalizeNumbers(canary.injected_value);
  return judgment.claims.some((c) => c.verdict === "unsupported" && normalizeNumbers(c.text).includes(v));
}

/** A control is a false alarm when the judge marks any material claim unsupported. */
export const falseAlarm = (judgment: JudgeOutput | null) => !!judgment && judgment.claims.some((c) => c.material && c.verdict === "unsupported");
