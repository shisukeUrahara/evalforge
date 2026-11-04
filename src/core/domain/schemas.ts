import { z } from "zod";

/** Id of one source piece: a JSON pointer into the Stripe OpenAPI slice, or a Northstar rule. */
export const SliceId = z.string().regex(/^(stripe:\/\S+|ns:NS-R\d+)$/, "slice id must be stripe:/<json-pointer> or ns:NS-R<n>");
export type SliceId = z.infer<typeof SliceId>;

export const Category = z.enum(["api_fact", "store_policy", "negative", "parity"]);
export type Category = z.infer<typeof Category>;

export const Split = z.enum(["tuning", "holdout"]);
export type Split = z.infer<typeof Split>;

/** What a good answer must do. Properties, not a gold string. */
export const Expected = z.object({
  must_refuse: z.boolean(),
  must_cite: z.array(SliceId).optional(),
  must_match_rule: z.string().regex(/^NS-R\d+$/).optional(),
  must_not_say: z.array(z.string().min(1)).optional(),
  not_a_stripe_fact: z.boolean().optional(),
});
export type Expected = z.infer<typeof Expected>;

export const Case = z.object({
  id: z.string().regex(/^c\d{3}$/),
  category: Category,
  question: z.string().min(5),
  context_slice_ids: z.array(SliceId).min(1),
  critical: z.boolean(),
  pair_id: z.string().regex(/^p\d{2}$/).optional(),
  expected: Expected,
  provenance: z.object({ drafted_by: z.string(), reviewed_by: z.string().optional() }),
});
export type Case = z.infer<typeof Case>;

/** What the model under test must return. It does not list its own claims; the judge extracts them. */
export const AnswerOutput = z.object({
  answer: z.string(),
  cited_source_ids: z.array(z.string()),
  refused: z.boolean(),
  refusal_reason: z.string().nullable(),
});
export type AnswerOutput = z.infer<typeof AnswerOutput>;

export const Verdict = z.enum(["supported", "unsupported", "uncertain"]);
export type Verdict = z.infer<typeof Verdict>;

export const ClaimJudgment = z.object({
  text: z.string().min(1),
  kind: z.enum(["api_fact", "store_policy", "general"]),
  material: z.boolean(),
  attributed_to: z.enum(["stripe", "northstar", "none"]),
  verdict: Verdict,
  evidence_id: z.string().nullable(),
});
export type ClaimJudgment = z.infer<typeof ClaimJudgment>;

export const JudgeOutput = z.object({
  claims: z.array(ClaimJudgment),
  relevance: z.number().int().min(1).max(5),
});
export type JudgeOutput = z.infer<typeof JudgeOutput>;

/** Arm slots: baseline A, candidates B (prompt), M (model swap), C (injected), and null-run copies. */
export const Arm = z.string().regex(/^(A|B|M|C|A2|M2)$/);
export type Arm = z.infer<typeof Arm>;

/** One human label of one answer: verdict per judge claim, plus claims the judge missed. */
export const Label = z.object({
  run_id: z.string(),
  case_id: z.string(),
  arm: Arm,
  repeat: z.number().int().min(0),
  claims: z.array(z.object({ index: z.number().int().min(0), material: z.boolean(), verdict: Verdict })),
  missed: z.array(z.object({ text: z.string().min(1), verdict: Verdict })),
  labeler: z.string(),
  at: z.string(),
});
export type Label = z.infer<typeof Label>;

export const Tier = z.enum(["critical", "priority", "warn"]);
export type Tier = z.infer<typeof Tier>;

/** A signed "ship anyway" for one non-critical check. Any change in the key voids it. */
export const Waiver = z.object({
  check_id: z.string(),
  candidate_prompt_sha: z.string(),
  candidate_model_spec: z.string(),
  dataset_sha: z.string(),
  rules_sha: z.string(),
  judge_sha: z.string(),
  failing_case_ids: z.array(z.string()),
  reason: z.string().min(10),
  approver: z.string(),
  at: z.string(),
});
export type Waiver = z.infer<typeof Waiver>;

/** A human check of a judge-flagged claim. */
export const Confirm = z.object({
  run_id: z.string(),
  check_id: z.string(),
  case_id: z.string(),
  decision: z.enum(["unsupported", "not_unsupported"]),
  by: z.string(),
  at: z.string(),
});
export type Confirm = z.infer<typeof Confirm>;

export const CheckStatus = z.enum(["pass", "fail", "warn", "pending_confirm", "failed_waived"]);
export type CheckStatus = z.infer<typeof CheckStatus>;

export const GateCheck = z.object({
  id: z.string(),
  tier: Tier,
  status: CheckStatus,
  reason_code: z.string(),
  case_ids: z.array(z.string()),
  label_source: z.enum(["deterministic", "human", "judge", "mixed"]),
  detail: z.string(),
});
export type GateCheck = z.infer<typeof GateCheck>;

export const GateResult = z.object({
  decision: z.enum(["ship", "block", "pending_confirm"]),
  checks: z.array(GateCheck),
});
export type GateResult = z.infer<typeof GateResult>;
