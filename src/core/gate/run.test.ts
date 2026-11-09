import { expect, test } from "vitest";
import { sha256Hex } from "../prompts/canonical";
import { gateRun } from "./run";

const RUN = "20261104T082431Z-tuning-B";
const status = (g: ReturnType<typeof gateRun>, id: string) => g.checks.find((c) => c.id === id)!.status;

test("the committed tuning run gates deterministically: B blocks on regressions, judge-only critical cases wait", () => {
  const cur = gateRun(process.cwd(), RUN, {});
  const judgeOnly = { ...cur.heads, labels: { lines: 0, sha: sha256Hex("") } };
  const a = gateRun(process.cwd(), RUN, { heads: judgeOnly });
  const b = gateRun(process.cwd(), RUN, { heads: judgeOnly });
  expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  expect(a.decision).toBe("block");
  expect(status(a, "regression_count")).toBe("fail");
  expect(status(a, "critical_unsupported_claim")).toBe("pending_confirm");
  expect(a.judge_trusted).toBe(false);
});

test("a human label that agrees turns the waiting critical case into a hard fail", () => {
  const g = gateRun(process.cwd(), RUN, {});
  expect(g.heads.labels.lines).toBeGreaterThan(0);
  expect(status(g, "critical_unsupported_claim")).toBe("fail");
});
