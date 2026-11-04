import type { Case } from "../domain/schemas";
import type { ScoredOutput } from "../run/output";

export type CheckCode = "semantic_wrong_refusal" | "semantic_cites_outside_context" | "semantic_missing_citation";

export interface CheckResult {
  /** false when the output never reached semantic checks (schema failure or refusal by the API). */
  evaluated: boolean;
  failures: { code: string; detail: string }[];
}

/**
 * Checks that need no model: right refusal decision, citations inside the
 * frozen context, required citations present. A schema failure is reported as
 * itself and gets no semantic checks, so it can never semantic-pass.
 */
export function basicChecks(c: Case, scored: ScoredOutput): CheckResult {
  if (scored.code !== "ok") return { evaluated: false, failures: [{ code: scored.code, detail: scored.detail }] };
  const out = scored.output;
  const failures: CheckResult["failures"] = [];
  if (out.refused !== c.expected.must_refuse) {
    failures.push({ code: "semantic_wrong_refusal", detail: c.expected.must_refuse ? "answered a question the sources do not cover" : "refused a question the sources answer" });
  }
  const outside = out.cited_source_ids.filter((id) => !c.context_slice_ids.includes(id));
  if (outside.length) failures.push({ code: "semantic_cites_outside_context", detail: outside.join(", ") });
  if (!out.refused) {
    const missing = (c.expected.must_cite ?? []).filter((id) => !out.cited_source_ids.includes(id));
    if (missing.length) failures.push({ code: "semantic_missing_citation", detail: missing.join(", ") });
  }
  return { evaluated: true, failures };
}
