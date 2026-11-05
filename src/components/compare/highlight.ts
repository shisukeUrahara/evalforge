import type { FinalClaim } from "@/core/score/labels";

export interface Segment {
  text: string;
  claim?: FinalClaim;
}

/**
 * Splits an answer into plain text and claim spans. A claim is marked only where its
 * text appears verbatim (ignoring case); the judge sometimes paraphrases, and those
 * claims are still listed under the answer.
 */
export function segments(answer: string, claims: readonly FinalClaim[]): Segment[] {
  const lower = answer.toLowerCase();
  const spans: { start: number; end: number; claim: FinalClaim }[] = [];
  for (const claim of claims) {
    const start = lower.indexOf(claim.text.toLowerCase());
    if (start < 0) continue;
    const end = start + claim.text.length;
    if (spans.some((s) => start < s.end && end > s.start)) continue;
    spans.push({ start, end, claim });
  }
  spans.sort((a, b) => a.start - b.start);
  const out: Segment[] = [];
  let at = 0;
  for (const s of spans) {
    if (s.start > at) out.push({ text: answer.slice(at, s.start) });
    out.push({ text: answer.slice(s.start, s.end), claim: s.claim });
    at = s.end;
  }
  if (at < answer.length) out.push({ text: answer.slice(at) });
  return out;
}
