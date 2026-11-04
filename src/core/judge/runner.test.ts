import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, expect, test } from "vitest";
import { loadSlices } from "../context/slices";
import { loadPricing } from "../cost/pricing";
import type { Case } from "../domain/schemas";
import { ResponseCache } from "../llm/cache";
import { loadModelRoles } from "../llm/config";
import { Gateway } from "../llm/gateway";
import { ok, startMockServer, type MockServer } from "../llm/testing/mockServer";
import { loadPrompt } from "../prompts/registry";
import { Budget } from "../runner/budget";
import type { OutputRow } from "../run/paired";
import { judgeOutputs } from "./runner";

const pricing = loadPricing("pricing.json");
let srv: MockServer | undefined;
afterEach(async () => srv?.close());
const c: Case = { id: "c001", category: "api_fact", question: "Can a refund exceed the charge?", context_slice_ids: ["stripe:refunds.create"], critical: true, expected: { must_refuse: false }, provenance: { drafted_by: "d" } };
const row = (arm: string, output: OutputRow["output"]) => ({ case_id: "c001", arm, repeat: 0, output }) as unknown as OutputRow;
const answer = { answer: "No.", cited_source_ids: [], refused: false, refusal_reason: null };

test("judges parsed answers only; a bad judge reply is judge_error", async () => {
  srv = await startMockServer([ok({ claims: [{ text: "No", kind: "api_fact", material: true, attributed_to: "stripe", verdict: "supported", evidence_id: "stripe:refunds.create" }], relevance: 5 }), { kind: "badJson" }]);
  const g = new Gateway(new ResponseCache(path.join(mkdtempSync(path.join(tmpdir(), "ef-")), "r")), { apiKey: "k", pricing, budget: new Budget(pricing, 1), baseURL: srv.baseURL });
  const out = await judgeOutputs({ rows: [row("A", answer), row("B", answer), row("C", null)], cases: new Map([["c001", c]]), slices: loadSlices(process.cwd()), prompt: loadPrompt(process.cwd(), "claims.v1", "judge"), role: loadModelRoles(process.cwd()).judge, gateway: g });
  expect(out.map((j) => [j.arm, j.status])).toEqual([
    ["A", "ok"],
    ["B", "judge_error"],
  ]);
});
