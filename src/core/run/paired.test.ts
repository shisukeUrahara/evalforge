import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, expect, test } from "vitest";
import { loadPolicy } from "../context/northstar";
import { loadSlices } from "../context/slices";
import type { Case } from "../domain/schemas";
import { loadPricing } from "../cost/pricing";
import { ResponseCache } from "../llm/cache";
import { loadModelRoles } from "../llm/config";
import { Gateway } from "../llm/gateway";
import { ok, startMockServer, type MockServer } from "../llm/testing/mockServer";
import { loadPrompt } from "../prompts/registry";
import { Budget } from "../runner/budget";
import { droppedCases, majority, median, runPaired } from "./paired";

const pricing = loadPricing("pricing.json");
const roles = loadModelRoles(process.cwd());
const slices = loadSlices(process.cwd());
const rules = new Map(loadPolicy("fixtures/northstar/policy_v1.md").map((r) => [r.id, r]));
let srv: MockServer | undefined;
afterEach(async () => srv?.close());

const c = (id: string): Case => ({ id, category: "store_policy", question: `How long is the return window? (${id})`, context_slice_ids: ["ns:NS-R1"], critical: true, expected: { must_refuse: false, must_cite: ["ns:NS-R1"], must_match_rule: "NS-R1" }, provenance: { drafted_by: "d" } });
const good = ok({ answer: "Within 30 days of delivery.", cited_source_ids: ["ns:NS-R1"], refused: false, refusal_reason: null });

test("every arm sees the same context; repeats and arms are separate calls; checks are scored", async () => {
  srv = await startMockServer([good]);
  const g = new Gateway(new ResponseCache(path.join(mkdtempSync(path.join(tmpdir(), "ef-")), "r")), { apiKey: "k", pricing, budget: new Budget(pricing, 1), baseURL: srv.baseURL });
  const arms = [
    { arm: "A", prompt: loadPrompt(process.cwd(), "A.v1"), role: roles.answer },
    { arm: "B", prompt: loadPrompt(process.cwd(), "B.v1"), role: roles.answer },
  ];
  const rows = await runPaired({ cases: [c("c001"), c("c002")], arms, repeats: 2, slices, rules, gateway: g });
  expect(rows).toHaveLength(8);
  expect(srv.requests).toHaveLength(8);
  expect(new Set(rows.filter((r) => r.case_id === "c001").map((r) => r.context_ref)).size).toBe(1);
  expect(rows.every((r) => r.output_code === "ok" && r.checks.length === 0)).toBe(true);
  const sys = (srv.requests[0].messages as { content: string }[])[0].content;
  expect(sys).toContain("[ns:NS-R1]");
});

test("a transport failure becomes a row and drops the case from every arm", async () => {
  srv = await startMockServer([{ kind: "http", status: 400 }]);
  const g = new Gateway(new ResponseCache(path.join(mkdtempSync(path.join(tmpdir(), "ef-")), "r")), { apiKey: "k", pricing, budget: new Budget(pricing, 1), baseURL: srv.baseURL, retry: { timeoutMs: 1000, backoffMs: [] } });
  const rows = await runPaired({ cases: [c("c001")], arms: [{ arm: "A", prompt: loadPrompt(process.cwd(), "A.v1"), role: roles.answer }], repeats: 1, slices, rules, gateway: g });
  expect(rows[0]).toMatchObject({ transport: "transport_other", output: null });
  expect([...droppedCases(rows)]).toEqual(["c001"]);
});

test("a cache miss in replay stops the run instead of becoming a row", async () => {
  const g = new Gateway(new ResponseCache(path.join(mkdtempSync(path.join(tmpdir(), "ef-")), "r")), null);
  await expect(runPaired({ cases: [c("c001")], arms: [{ arm: "A", prompt: loadPrompt(process.cwd(), "A.v1"), role: roles.answer }], repeats: 1, slices, rules, gateway: g })).rejects.toThrow(/not in the response cache/);
});

test("majority and median pooling", () => {
  expect([majority([true, true, false]), majority([true, false, false]), majority([true])]).toEqual([true, false, true]);
  expect([median([0, 2, 1]), median([0, 1]), median([3])]).toEqual([1, 0.5, 3]);
});
