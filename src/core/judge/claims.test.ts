import { expect, test } from "vitest";
import { loadSlices } from "../context/slices";
import type { Case } from "../domain/schemas";
import { loadModelRoles } from "../llm/config";
import { loadPrompt } from "../prompts/registry";
import type { OutputRow } from "../run/paired";
import { judgeRequest, parseJudgment, unsupportedMaterial } from "./claims";

const claim = { text: "Refunds may exceed the charge", kind: "api_fact", material: true, attributed_to: "stripe", verdict: "unsupported", evidence_id: "stripe:refunds.create" };
const raw = (v: unknown, finish = "stop") => ({ raw_text: typeof v === "string" ? v : JSON.stringify(v), finish_reason: finish, refusal: null });

test("a valid judgment parses and counts unsupported material claims", () => {
  const j = parseJudgment(raw({ claims: [claim, { ...claim, material: false }, { ...claim, verdict: "supported" }], relevance: 4 }));
  expect(j.status).toBe("ok");
  if (j.status === "ok") expect(unsupportedMaterial(j.output)).toBe(1);
});

test("broken judge output is judge_error, never unsupported", () => {
  expect(parseJudgment(raw("{not json")).status).toBe("judge_error");
  expect(parseJudgment(raw({ claims: [{ ...claim, verdict: "wrong" }], relevance: 4 })).status).toBe("judge_error");
  expect(parseJudgment(raw({ claims: [], relevance: 4 }, "length"))).toEqual({ status: "judge_error", detail: "judge output truncated" });
  expect(parseJudgment({ raw_text: null, finish_reason: "stop", refusal: "no" }).status).toBe("judge_error");
});

test("the judge sees the case's frozen context and the answer, keyed per arm and repeat", async () => {
  const c: Case = { id: "c001", category: "api_fact", question: "Can a refund exceed the charge?", context_slice_ids: ["stripe:refunds.create"], critical: true, expected: { must_refuse: false }, provenance: { drafted_by: "d" } };
  const row = { case_id: "c001", arm: "B", repeat: 2, output: { answer: "Yes, a little over is fine.", cited_source_ids: [], refused: false, refusal_reason: null } } as OutputRow;
  const req = await judgeRequest(c, row, loadSlices(process.cwd()), loadPrompt(process.cwd(), "claims.v1", "judge"), loadModelRoles(process.cwd()).judge);
  expect([req.arm, req.repeat, req.schemaName]).toEqual(["judge-B", 2, "claim_judgment"]);
  expect(req.messages[0].content).toContain("[stripe:refunds.create]");
  expect(req.messages[1].content).toContain("Yes, a little over is fine.");
});
