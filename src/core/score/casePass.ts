import type { OutputRow } from "../run/paired";
import type { FinalClaim } from "./labels";

export type CaseStatus = "pass" | "fail" | "not_evaluated";

export interface CaseScore {
  status: CaseStatus;
  reasons: string[];
  unsupported: number;
  uncertain: number;
  label_source: "human" | "judge" | "mixed" | "deterministic";
}

/**
 * Pre-registered case pass rule (docs/labeling_guide.md): schema-valid, every
 * deterministic and expected check passes, and zero unsupported or uncertain
 * material claims. An answer the judge could not read is not_evaluated, never a pass.
 */
export function scoreAnswer(row: OutputRow, claims: FinalClaim[] | null): CaseScore {
  const reasons = row.output_code === "ok" ? row.checks.map((c) => c.code) : [row.output_code];
  if (row.output_code !== "ok") return { status: "fail", reasons, unsupported: 0, uncertain: 0, label_source: "deterministic" };
  if (claims === null) return { status: "not_evaluated", reasons: [...reasons, "judge_error"], unsupported: 0, uncertain: 0, label_source: "deterministic" };
  const material = claims.filter((c) => c.material);
  const unsupported = material.filter((c) => c.verdict === "unsupported").length;
  const uncertain = material.filter((c) => c.verdict === "uncertain").length;
  if (unsupported) reasons.push("semantic_unsupported_claim");
  if (uncertain) reasons.push("semantic_uncertain_claim");
  const sources = new Set(material.map((c) => c.source));
  const label_source = sources.size === 0 ? "deterministic" : sources.size === 2 ? "mixed" : [...sources][0];
  return { status: reasons.length ? "fail" : "pass", reasons, unsupported, uncertain, label_source };
}
