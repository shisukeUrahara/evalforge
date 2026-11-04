import { describe, expect, test } from "vitest";
import { AnswerOutput, Case, JudgeOutput, SliceId, Waiver } from "./schemas";

const good = {
  id: "c001",
  category: "api_fact",
  question: "Can a refund exceed the charge?",
  context_slice_ids: ["stripe:refunds.create"],
  critical: true,
  expected: { must_refuse: false, must_cite: ["stripe:refunds.create"] },
  provenance: { drafted_by: "openai:gpt-4.1-2025-04-14" },
};

describe("schemas", () => {
  test("slice ids are stripe pointers or Northstar rules", () => {
    expect(SliceId.safeParse("stripe:refunds.create").success).toBe(true);
    expect(SliceId.safeParse("ns:NS-R3").success).toBe(true);
    expect(SliceId.safeParse("slice-returns").success).toBe(false);
    expect(SliceId.safeParse("stripe:/paths/x").success).toBe(false);
    expect(SliceId.safeParse("ns:R3").success).toBe(false);
  });
  test("a valid case parses; bad ids and empty context do not", () => {
    expect(Case.parse(good).id).toBe("c001");
    expect(Case.safeParse({ ...good, id: "case1" }).success).toBe(false);
    expect(Case.safeParse({ ...good, context_slice_ids: [] }).success).toBe(false);
    expect(Case.safeParse({ ...good, expected: { must_refuse: false, must_match_rule: "R3" } }).success).toBe(false);
  });
  test("answer output needs every field; refusal_reason is nullable, not optional", () => {
    expect(AnswerOutput.safeParse({ answer: "x", cited_source_ids: [], refused: false, refusal_reason: null }).success).toBe(true);
    expect(AnswerOutput.safeParse({ answer: "x", cited_source_ids: [], refused: false }).success).toBe(false);
  });
  test("judge output rejects unknown verdicts and out-of-range relevance", () => {
    const claim = { text: "t", kind: "api_fact", material: true, attributed_to: "stripe", verdict: "supported", evidence_id: null };
    expect(JudgeOutput.safeParse({ claims: [claim], relevance: 4 }).success).toBe(true);
    expect(JudgeOutput.safeParse({ claims: [{ ...claim, verdict: "maybe" }], relevance: 4 }).success).toBe(false);
    expect(JudgeOutput.safeParse({ claims: [], relevance: 9 }).success).toBe(false);
  });
  test("a waiver needs a real reason", () => {
    const w = { check_id: "regression_count", candidate_prompt_sha: "a", candidate_model_spec: "m", dataset_sha: "d", rules_sha: "r", judge_sha: "j", failing_case_ids: ["c001"], reason: "ok", approver: "lee", at: "t" };
    expect(Waiver.safeParse(w).success).toBe(false);
    expect(Waiver.safeParse({ ...w, reason: "tone change only, reviewed by hand" }).success).toBe(true);
  });
});
