import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { repoState } from "./git";
import { DirtyTreeError, guardRun, PreregistrationError } from "./guard";
import { readRunFile, runId, writeRunFolder } from "./runs";

function repo() {
  const dir = mkdtempSync(path.join(tmpdir(), "ef-git-"));
  const g = (...a: string[]) => execFileSync("git", ["-C", dir, "-c", "user.email=t@t", "-c", "user.name=t", ...a]);
  g("init", "-q");
  writeFileSync(path.join(dir, "a.txt"), "a");
  g("add", "-A");
  g("commit", "-qm", "init");
  return { dir, g };
}

test("holdout needs both pre-registration files committed", () => {
  const { dir, g } = repo();
  expect(() => guardRun("holdout", repoState(dir), false)).toThrow(PreregistrationError);
  mkdirSync(path.join(dir, "docs"));
  mkdirSync(path.join(dir, "gate"));
  writeFileSync(path.join(dir, "docs/labeling_guide.md"), "rules");
  writeFileSync(path.join(dir, "gate/rules.v1.json"), "{}");
  g("add", "-A");
  g("commit", "-qm", "prereg");
  expect(() => guardRun("holdout", repoState(dir), false)).not.toThrow();
});

test("a dirty tree throws on holdout unless allowed; tuning is never guarded", () => {
  const { dir } = repo();
  writeFileSync(path.join(dir, "new.txt"), "x");
  const state = { ...repoState(dir), preregistration: { "docs/labeling_guide.md": "x", "gate/rules.v1.json": "y" } };
  expect(state.git_dirty).toBe(true);
  expect(() => guardRun("holdout", state, false)).toThrow(DirtyTreeError);
  expect(() => guardRun("holdout", state, true)).not.toThrow();
  expect(() => guardRun("tuning", { ...state, preregistration: { a: null } }, false)).not.toThrow();
});

test("run ids sort by time; run folders get checksums; unsafe ids are refused", () => {
  expect(runId(new Date("2026-11-04T10:15:00.123Z"), "holdout", "B")).toBe("20261104T101500Z-holdout-B");
  const dir = mkdtempSync(path.join(tmpdir(), "ef-run-"));
  writeRunFolder(path.join(dir, "runs", "r1"), { "a.json": "{}" });
  expect(readFileSync(path.join(dir, "runs", "r1", "checksums.txt"), "utf8")).toMatch(/^[0-9a-f]{64} {2}a\.json\n$/);
  expect(readRunFile(dir, "r1", "a.json")).toBe("{}");
  expect(readRunFile(dir, "../r1", "a.json")).toBeNull();
});
