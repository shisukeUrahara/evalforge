import { cpSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, expect, test } from "vitest";
import { loadCases } from "@/core/dataset/registry";
import { ok, startMockServer, type MockServer } from "@/core/llm/testing/mockServer";
import { main } from "../main";
import { testDeps } from "../testing/deps";

let srv: MockServer | undefined;
afterEach(async () => srv?.close());

const d = (q: string, ids: string[], extra: object = {}) => ({
  question: q,
  context_slice_ids: ids,
  critical: false,
  pair: null,
  expected: { must_refuse: false, must_cite: ids, must_match_rule: null, must_not_say: [], not_a_stripe_fact: false },
  ...extra,
});
const batch = (n: number, make: (i: number) => object) => ok({ cases: Array.from({ length: n }, (_, i) => make(i)) });

test("drafts 4 categories, assigns ids and pairs, writes the dataset, and replays from cache", async () => {
  const dir = mkdtempSync(path.join(tmpdir(), "ef-"));
  cpSync("fixtures", path.join(dir, "fixtures"), { recursive: true });
  cpSync("data/prompts", path.join(dir, "data/prompts"), { recursive: true });
  srv = await startMockServer([
    batch(20, (i) => d(`api question number ${i} about refunds and charges`, ["stripe:refunds.create"])),
    batch(20, (i) => d(`store question number ${i} about returning gear`, ["ns:NS-R1"])),
    batch(20, (i) => ({ ...d(`negative question number ${i} on a made up thing`, ["stripe:refunds.create"]), expected: { must_refuse: true, must_cite: [], must_match_rule: null, must_not_say: [], not_a_stripe_fact: false } })),
    batch(20, (i) => d(`${i % 2 ? "Ana" : "Bo"} asks parity question ${Math.floor(i / 2)} about refund status`, ["stripe:refund.status"], { pair: Math.floor(i / 2) + 1 })),
  ]);
  const t = testDeps({ dataDir: dir, baseURL: srv.baseURL });
  expect(await main(["draft-cases"], t.deps)).toBe(0);
  const cases = loadCases(dir, "support-v1");
  expect(cases).toHaveLength(80);
  expect(cases[0].id).toBe("c001");
  expect(cases[79]).toMatchObject({ id: "c080", category: "parity", pair_id: "p10" });
  expect(srv.requests).toHaveLength(4);

  expect(await main(["draft-cases"], testDeps({ dataDir: dir }).deps)).toBe(64); // exists, no --force
  const again = testDeps({ dataDir: dir, cacheDir: t.cacheDir }); // replay: no key
  expect(await main(["draft-cases", "--force"], again.deps)).toBe(0);
  expect(again.out[0]).toBe("api_fact: 20 cases (cached)");
});

