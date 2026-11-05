import { readFileSync } from "node:fs";
import { expect, test } from "vitest";
import { TRUST_BAR } from "../metrics/trust";

test("gate rules v1 repeat the trust bar the code uses", () => {
  const r = JSON.parse(readFileSync("gate/rules.v1.json", "utf8"));
  expect(r.trust_bar).toEqual({ kappa: TRUST_BAR.kappa, recall: TRUST_BAR.recall, min_unsupported: TRUST_BAR.minUnsupported, extraction_miss: TRUST_BAR.extractionMiss, canary_recall: TRUST_BAR.canaryRecall, control_fpr: TRUST_BAR.controlFpr });
  expect(r.priority.regression_count).toMatchObject({ categories: ["store_policy", "negative"], min: 2, noise_margin: 1 });
  expect(r.warn).toMatchObject({ latency_p95_up_pct: 25, cost_up_pct: 25 });
});
