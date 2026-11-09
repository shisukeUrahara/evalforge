import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, expect, test } from "vitest";
import { ForbiddenError } from "@/core/auth/roles";
import { confirmCase, waiveCheck } from "./gateActions";

const B = "20261105T043553Z-holdout-B";
const NULL = "20261105T043647Z-holdout-A2";
let dir: string;

// A throwaway copy of the data folder: the real runs/ and data/ are never written by tests.
beforeEach(() => {
  dir = mkdtempSync(path.join(tmpdir(), "ef-actions-"));
  for (const d of ["data", "fixtures", "gate", "config", "pricing.json", `runs/${B}`, `runs/${NULL}`]) cpSync(d, path.join(dir, d), { recursive: true });
});
afterEach(() => rmSync(dir, { recursive: true, force: true }));

const gate = () => JSON.parse(readFileSync(path.join(dir, "runs", B, "gate.json"), "utf8"));
const now = new Date("2026-11-05T12:00:00Z");

test("maya is refused and nothing is written", () => {
  const before = readFileSync(path.join(dir, "runs", B, "gate.json"), "utf8");
  expect(() => waiveCheck(dir, { runId: B, checkId: "regression_count", reason: "accepted for the tone test", user: "maya", now })).toThrow(ForbiddenError);
  expect(() => confirmCase(dir, { runId: B, caseId: "c042", decision: "unsupported", user: "maya", now })).toThrow(ForbiddenError);
  expect(existsSync(path.join(dir, "data/waivers.jsonl"))).toBe(false);
  expect(readFileSync(path.join(dir, "runs", B, "gate.json"), "utf8")).toBe(before);
});

test("only a failing priority check can be waived, with a reason of 10+ characters", () => {
  expect(() => waiveCheck(dir, { runId: B, checkId: "schema_regression", reason: "long enough reason", user: "lee", now })).toThrow(/not a failing priority check/);
  expect(() => waiveCheck(dir, { runId: B, checkId: "regression_count", reason: "short", user: "lee", now })).toThrow();
  expect(() => confirmCase(dir, { runId: B, caseId: "c042", decision: "unsupported", user: "lee", now })).toThrow(/not waiting for a confirm/);
});

test("lee's waiver is logged and gate.json is rewritten like ef gate, keeping null run and judge", () => {
  const g = waiveCheck(dir, { runId: B, checkId: "regression_count", reason: "tone change accepted for this release", user: "lee", now });
  expect(g.checks.find((c) => c.id === "regression_count")!.status).toBe("failed_waived");
  // The human-labeled critical failure (c049) is never waivable, so B stays blocked.
  expect(g.checks.find((c) => c.id === "critical_unsupported_claim")!.status).toBe("fail");
  expect(g.decision).toBe("block");
  const written = gate();
  expect(written.null_run).toBe(NULL);
  expect(written.judge).toBe("claims.v1");
  expect(written.heads.waivers.lines).toBe(1);
  expect(readFileSync(path.join(dir, "runs", B, "gate.json"), "utf8")).toBe(JSON.stringify(g, null, 2) + "\n");
});
