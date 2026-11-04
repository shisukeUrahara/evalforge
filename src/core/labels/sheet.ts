import { z } from "zod";
import { mulberry32, shuffle } from "../dataset/rng";
import type { Case, JudgeOutput, Label, Verdict } from "../domain/schemas";

export const SheetKey = z.record(
  z.string(),
  z.object({ run_id: z.string(), case_id: z.string(), arm: z.string(), repeat: z.number().int(), random_half: z.boolean(), claims: z.number().int() }),
);
export type SheetKey = z.infer<typeof SheetKey>;

export interface Candidate {
  run_id: string;
  case_id: string;
  arm: string;
  repeat: number;
  answer: string;
  judgment: JudgeOutput;
}

const flagged = (j: JudgeOutput) => j.claims.some((c) => c.material && c.verdict !== "supported");

/**
 * Pre-registered sampling: half the answers from those the judge flagged
 * (unsupported or uncertain material claim), half at random from the rest.
 * Shuffled together and given opaque ids, so the labeler sees neither the arm
 * nor the judge's verdicts.
 */
export function sampleForLabels(cands: readonly Candidate[], n: number, seed: number): { item: string; c: Candidate; random_half: boolean }[] {
  const rng = mulberry32(seed);
  const flaggedPool = shuffle(cands.filter((c) => flagged(c.judgment)), rng);
  const half = Math.min(Math.floor(n / 2), flaggedPool.length);
  const fromFlagged = flaggedPool.slice(0, half);
  const rest = shuffle(cands.filter((c) => !fromFlagged.includes(c)), rng).slice(0, n - half);
  const picked = shuffle([...fromFlagged.map((c) => ({ c, random_half: false })), ...rest.map((c) => ({ c, random_half: true }))], rng);
  return picked.map((p, i) => ({ item: `L${String(i + 1).padStart(2, "0")}`, ...p }));
}

/** A plain-text sheet a person can fill in an editor. No arm, no judge verdicts. */
export function renderSheet(items: ReturnType<typeof sampleForLabels>, cases: ReadonlyMap<string, Case>, context: (caseId: string) => string): string {
  const head = [
    "# Label sheet",
    "",
    "For each claim, fill `verdict:` with s (supported), u (unsupported) or ? (uncertain), using only the Sources shown.",
    "Change `material: y` to `n` if the claim is not something a customer could act on (greetings, empathy, 'contact support').",
    "Under `missed:` add any material claim the list forgot, one per line, as `- u: text` or `- s: text`.",
    "Rules: docs/labeling_guide.md. Save the file, then run: pnpm ef apply-labels --sheet <this file>",
    "",
  ];
  const body = items.flatMap(({ item, c }) => [
    `## ${item}`,
    "",
    `Question: ${cases.get(c.case_id)!.question}`,
    "",
    "Sources:",
    context(c.case_id),
    "",
    "Answer:",
    c.answer,
    "",
    "Claims:",
    ...c.judgment.claims.map((cl, i) => `${i + 1}. ${cl.text} | material: ${cl.material ? "y" : "n"} | verdict: `),
    "",
    "missed:",
    "",
  ]);
  return [...head, ...body].join("\n");
}

const V: Record<string, Verdict> = { s: "supported", u: "unsupported", "?": "uncertain" };

/** Reads a filled sheet back. Every claim needs a verdict; problems are listed, not guessed. */
export function parseSheet(text: string, key: SheetKey, labeler: string, at: string): { labels: Label[]; problems: string[] } {
  const labels: Label[] = [];
  const problems: string[] = [];
  for (const block of text.split(/^## /m).slice(1)) {
    const item = block.split("\n")[0].trim();
    const k = key[item];
    if (!k) {
      problems.push(`${item}: not in the key`);
      continue;
    }
    const claims: Label["claims"] = [];
    for (const m of block.matchAll(/^(\d+)\. .* \| material: ([yn]) \| verdict: *(\S*)\s*$/gm)) {
      const v = V[m[3].toLowerCase()];
      if (!v) problems.push(`${item} claim ${m[1]}: verdict must be s, u or ?`);
      else claims.push({ index: Number(m[1]) - 1, material: m[2] === "y", verdict: v });
    }
    if (claims.length + problems.filter((p) => p.startsWith(`${item} claim`)).length !== k.claims) problems.push(`${item}: expected ${k.claims} claim lines`);
    const missedPart = block.split(/^missed:\s*$/m)[1] ?? "";
    const missed = [...missedPart.matchAll(/^- *([su?]) *: *(.+)$/gm)].map((m) => ({ verdict: V[m[1]], text: m[2].trim() }));
    labels.push({ run_id: k.run_id, case_id: k.case_id, arm: k.arm, repeat: k.repeat, claims, missed, labeler, at });
  }
  for (const item of Object.keys(key)) if (!labels.some((l) => key[item].case_id === l.case_id && key[item].arm === l.arm && key[item].repeat === l.repeat)) problems.push(`${item}: missing from the sheet`);
  return { labels, problems };
}
