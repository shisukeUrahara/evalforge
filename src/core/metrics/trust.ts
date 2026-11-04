import type { Verdict } from "../domain/schemas";
import { cohenKappa } from "./agreement";
import { wilson } from "./wilson";

/** Pre-registered trust bar (gate/rules.v1.json repeats these). */
export const TRUST_BAR = { kappa: 0.6, recall: 0.8, minUnsupported: 15, extractionMiss: 0.1, canaryRecall: 0.9, controlFpr: 0.2 } as const;

export interface LabeledClaim {
  human: Verdict;
  /** null when the judge missed the claim entirely. */
  judge: Verdict | null;
  material: boolean;
  /** Answer was drawn by the random half of the sampling plan (recall is measured there only). */
  random_half: boolean;
}

export interface TrustLine {
  name: string;
  value: number | null;
  n: number;
  low: number | null;
  high: number | null;
  bar: string;
  status: "pass" | "fail" | "not_estimable";
}

/**
 * The judge is trusted alone only when every line passes. Recall is measured on
 * the random half only (the flagged half would inflate it) and needs at least
 * 15 human-found unsupported claims to be estimable.
 */
export function trustReport(claims: readonly LabeledClaim[], canaries: { caught: number; total: number }, controls: { flagged: number; total: number }): { lines: TrustLine[]; trusted: boolean } {
  const both = claims.filter((c) => c.judge !== null);
  const k = both.length ? cohenKappa(both.map((c) => c.human), both.map((c) => c.judge!)) : null;
  const pool = claims.filter((c) => c.random_half && c.material && c.human === "unsupported");
  const caught = pool.filter((c) => c.judge === "unsupported").length;
  const material = claims.filter((c) => c.material);
  const missed = material.filter((c) => c.judge === null).length;
  const rate = (kk: number, n: number) => (n ? kk / n : null);
  const ci = (kk: number, n: number) => (n ? wilson(kk, n) : { low: null, high: null });
  const lines: TrustLine[] = [
    { name: "Agreement κ (judge vs human)", value: k, n: both.length, low: null, high: null, bar: `≥ ${TRUST_BAR.kappa}`, status: k === null ? "not_estimable" : k >= TRUST_BAR.kappa ? "pass" : "fail" },
    { name: "Recall on unsupported claims (random half)", value: rate(caught, pool.length), n: pool.length, ...ci(caught, pool.length), bar: `≥ ${TRUST_BAR.recall}, n ≥ ${TRUST_BAR.minUnsupported}`, status: pool.length < TRUST_BAR.minUnsupported ? "not_estimable" : caught / pool.length >= TRUST_BAR.recall ? "pass" : "fail" },
    { name: "Missed claims (extraction)", value: rate(missed, material.length), n: material.length, ...ci(missed, material.length), bar: `≤ ${TRUST_BAR.extractionMiss}`, status: material.length === 0 ? "not_estimable" : missed / material.length <= TRUST_BAR.extractionMiss ? "pass" : "fail" },
    { name: "Canary recall", value: rate(canaries.caught, canaries.total), n: canaries.total, ...ci(canaries.caught, canaries.total), bar: `≥ ${TRUST_BAR.canaryRecall}`, status: canaries.total === 0 ? "not_estimable" : canaries.caught / canaries.total >= TRUST_BAR.canaryRecall ? "pass" : "fail" },
    { name: "Control false alarms", value: rate(controls.flagged, controls.total), n: controls.total, ...ci(controls.flagged, controls.total), bar: `≤ ${TRUST_BAR.controlFpr}`, status: controls.total === 0 ? "not_estimable" : controls.flagged / controls.total <= TRUST_BAR.controlFpr ? "pass" : "fail" },
  ];
  return { lines, trusted: lines.every((l) => l.status === "pass") };
}
