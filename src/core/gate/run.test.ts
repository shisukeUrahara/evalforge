import { expect, test } from "vitest";
import { gateRun } from "./run";

test("the committed tuning run gates deterministically: B blocks on regressions, judge-only critical cases wait", () => {
  const a = gateRun(process.cwd(), "20261104T082431Z-tuning-B", {});
  const b = gateRun(process.cwd(), "20261104T082431Z-tuning-B", { heads: a.heads });
  expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  expect(a.decision).toBe("block");
  expect(a.checks.find((c) => c.id === "regression_count")!.status).toBe("fail");
  expect(a.checks.find((c) => c.id === "critical_unsupported_claim")!.status).toBe("pending_confirm");
  expect(a.judge_trusted).toBe(false);
});
