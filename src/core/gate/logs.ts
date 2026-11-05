import path from "node:path";
import { requireAction } from "../auth/roles";
import { appendJsonl } from "../dataset/jsonl";
import { Confirm, Waiver } from "../domain/schemas";

export const WAIVERS_LOG = "data/waivers.jsonl";
export const CONFIRMS_LOG = "data/confirms.jsonl";
/** Only priority checks can be waived. Critical ones never can. */
export const WAIVABLE = new Set(["regression_count"]);

export class NotWaivableError extends Error {
  constructor(check: string) {
    super(`${check} is not waivable. Critical checks can never be waived; fix the candidate instead.`);
    this.name = "NotWaivableError";
  }
}

/** Appends a waiver. Append-only: git history is the audit trail. */
export function addWaiver(dataDir: string, w: Waiver): Waiver {
  requireAction(w.approver, "waive");
  if (!WAIVABLE.has(w.check_id)) throw new NotWaivableError(w.check_id);
  const parsed = Waiver.parse({ ...w, failing_case_ids: [...w.failing_case_ids].sort() });
  appendJsonl(path.join(dataDir, WAIVERS_LOG), parsed);
  return parsed;
}

/** Appends a human check of one judge-flagged critical case. */
export function addConfirm(dataDir: string, c: Confirm): Confirm {
  requireAction(c.by, "confirm");
  if (c.check_id !== "critical_unsupported_claim") throw new Error("only critical_unsupported_claim cases are confirmed by a human");
  const parsed = Confirm.parse(c);
  appendJsonl(path.join(dataDir, CONFIRMS_LOG), parsed);
  return parsed;
}
