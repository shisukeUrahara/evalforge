import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { addConfirm, addWaiver } from "./logs";

const dir = () => mkdtempSync(path.join(tmpdir(), "ef-"));
const w = { check_id: "regression_count", candidate_prompt_sha: "p", candidate_model_spec: "m", dataset_sha: "d", rules_sha: "r", judge_sha: "j", failing_case_ids: ["c2", "c1"], reason: "tone change only, both cases read by hand", approver: "lee", at: "t" };

test("lee can waive a priority check; ids are stored sorted; the log is append-only JSONL", () => {
  const d = dir();
  addWaiver(d, w);
  addWaiver(d, w);
  const lines = readFileSync(path.join(d, "data/waivers.jsonl"), "utf8").trim().split("\n");
  expect(lines).toHaveLength(2);
  expect(JSON.parse(lines[0]).failing_case_ids).toEqual(["c1", "c2"]);
});

test("critical checks are never waivable; maya cannot waive or confirm", () => {
  expect(() => addWaiver(dir(), { ...w, check_id: "critical_unsupported_claim" })).toThrow(/never be waived/);
  expect(() => addWaiver(dir(), { ...w, approver: "maya" })).toThrow(/maya may not waive/);
  expect(() => addConfirm(dir(), { run_id: "r", check_id: "critical_unsupported_claim", case_id: "c1", decision: "unsupported", by: "maya", at: "t" })).toThrow(/maya may not confirm/);
  expect(addConfirm(dir(), { run_id: "r", check_id: "critical_unsupported_claim", case_id: "c1", decision: "unsupported", by: "lee", at: "t" }).by).toBe("lee");
});
