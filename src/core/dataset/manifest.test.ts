import { expect, test } from "vitest";
import type { Case } from "../domain/schemas";
import { buildManifest, casesFor } from "./manifest";

const c = (id: string, q = "question text here"): Case => ({ id, category: "api_fact", question: q, context_slice_ids: ["stripe:refunds.create"], critical: false, expected: { must_refuse: false }, provenance: { drafted_by: "d" } });

test("split cases come back only while the dataset is unchanged", () => {
  const cases = [c("c001"), c("c002")];
  const m = buildManifest("x", cases, { c001: "tuning", c002: "holdout" }, 1);
  expect(m.counts).toEqual({ tuning: 1, holdout: 1 });
  expect(casesFor(cases, m, "holdout").map((x) => x.id)).toEqual(["c002"]);
  expect(() => casesFor([c("c001"), c("c002", "edited")], m, "holdout")).toThrow(/changed since the split was frozen/);
});
