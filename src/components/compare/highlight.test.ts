import { expect, test } from "vitest";
import type { FinalClaim } from "@/core/score/labels";
import { segments } from "./highlight";

const claim = (text: string, verdict: FinalClaim["verdict"] = "supported"): FinalClaim => ({ text, material: true, verdict, source: "judge", judge_verdict: verdict });

test("marks verbatim claims in order and keeps the rest as plain text", () => {
  const a = "No. A refund cannot exceed the charge. Ask support.";
  const out = segments(a, [claim("ask support.", "uncertain"), claim("A refund cannot exceed the charge.")]);
  expect(out.map((s) => [s.text, s.claim?.verdict])).toEqual([
    ["No. ", undefined],
    ["A refund cannot exceed the charge.", "supported"],
    [" ", undefined],
    ["Ask support.", "uncertain"],
  ]);
  expect(out.map((s) => s.text).join("")).toBe(a);
});

test("paraphrased and overlapping claims are not marked", () => {
  expect(segments("Refunds take 5 days.", [claim("refunds are slow"), claim("Refunds take 5 days."), claim("take 5")])).toEqual([{ text: "Refunds take 5 days.", claim: claim("Refunds take 5 days.") }]);
});
