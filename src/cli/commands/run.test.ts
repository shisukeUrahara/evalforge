import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, expect, test } from "vitest";
import { ok, startMockServer, type MockServer } from "@/core/llm/testing/mockServer";
import { resolveArms } from "@/core/run/arms";
import { loadModelRoles } from "@/core/llm/config";
import { main } from "../main";
import { testDeps } from "../testing/deps";

let srv: MockServer | undefined;
afterEach(async () => srv?.close());

function workdir() {
  const dir = mkdtempSync(path.join(tmpdir(), "ef-run-"));
  for (const p of ["fixtures", "data", "config", "pricing.json", "docs"]) cpSync(p, path.join(dir, p), { recursive: true });
  const g = (...a: string[]) => execFileSync("git", ["-C", dir, "-c", "user.email=t@t", "-c", "user.name=t", ...a]);
  g("init", "-q");
  g("add", "-A");
  g("commit", "-qm", "x");
  return dir;
}

test("candidates resolve to arms: prompt change, model swap, null run", () => {
  const roles = loadModelRoles(process.cwd());
  expect(resolveArms(process.cwd(), roles, "A.v1", "prompt:B.v1").map((a) => [a.arm, a.prompt.name, a.role.spec])).toEqual([
    ["A", "A.v1", roles.answer.spec],
    ["B", "B.v1", roles.answer.spec],
  ]);
  expect(resolveArms(process.cwd(), roles, "A.v1", "model:swap")[1]).toMatchObject({ arm: "M", role: roles.swap });
  expect(resolveArms(process.cwd(), roles, "A.v1", "null")[1].arm).toBe("A2");
  expect(() => resolveArms(process.cwd(), roles, "A.v1", "prompt:A.v1")).toThrow(/--candidate/);
});

test("a tuning run writes a manifest and one output row per case x arm x repeat", async () => {
  const dir = workdir();
  srv = await startMockServer([ok({ answer: "Within 30 days.", cited_source_ids: [], refused: false, refusal_reason: null })]);
  const t = testDeps({ dataDir: dir, baseURL: srv.baseURL });
  expect(await main(["run", "--split", "tuning"], t.deps)).toBe(0);
  const [id] = readdirSync(path.join(dir, "runs")).filter((d) => d.endsWith("-tuning-B"));
  const manifest = JSON.parse(readFileSync(path.join(dir, "runs", id, "manifest.json"), "utf8"));
  expect(manifest).toMatchObject({ split: "tuning", sample_count: 30, repetitions: 1, policy_version: "v1", git_dirty: false });
  expect(manifest.arms.map((a: { arm: string }) => a.arm)).toEqual(["A", "B"]);
  expect(readFileSync(path.join(dir, "runs", id, "outputs.jsonl"), "utf8").trim().split("\n")).toHaveLength(60);
  expect(t.out.at(-1)).toMatch(/60 answers, 0 cached, 0 cases dropped/);
});

test("dry run counts calls; holdout without committed gate rules is refused", async () => {
  const dir = workdir();
  const t = testDeps({ dataDir: dir });
  expect(await main(["run", "--dry-run", "--candidate", "null"], t.deps)).toBe(0);
  expect(t.out[0]).toBe("tuning: 30 cases x 2 arms (A, A2) x 1 repeats = 60 calls; replay mode");
  expect(await main(["run", "--split", "holdout"], t.deps)).toBe(5);
  expect(t.err.at(-1)).toMatch(/gate\/rules.v1.json not committed/);
});
