import type { JudgeOutput, Label, Verdict } from "../domain/schemas";

export interface FinalClaim {
  text: string;
  material: boolean;
  verdict: Verdict;
  source: "human" | "judge";
  /** What the judge said, or null for a claim the judge missed. */
  judge_verdict: Verdict | null;
}

export const answerKey = (x: { case_id: string; arm: string; repeat: number }) => `${x.case_id}/${x.arm}/${x.repeat}`;

/**
 * Final claims for one answer: the human label wins wherever it exists
 * (verdict and material), claims the human added are included, and every claim
 * says which source decided it.
 */
export function mergeClaims(judge: JudgeOutput, label: Label | undefined): FinalClaim[] {
  const claims: FinalClaim[] = judge.claims.map((c, i) => {
    const h = label?.claims.find((x) => x.index === i);
    return h
      ? { text: c.text, material: h.material, verdict: h.verdict, source: "human", judge_verdict: c.verdict }
      : { text: c.text, material: c.material, verdict: c.verdict, source: "judge", judge_verdict: c.verdict };
  });
  for (const m of label?.missed ?? []) claims.push({ text: m.text, material: true, verdict: m.verdict, source: "human", judge_verdict: null });
  return claims;
}
