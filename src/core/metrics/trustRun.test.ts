import { expect, test } from "vitest";
import { trustFor } from "./trustRun";

test("before any human labels the judge is not trusted; canary recall is already measured", () => {
  const t = trustFor(process.cwd(), "claims.v1", "holdout", ["20261105T043553Z-holdout-B"], { lines: 0, sha: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" });
  expect(t.trusted).toBe(false);
  expect(t.answers_labeled).toBe(0);
  expect(t.lines.find((l) => l.name === "Canary recall")).toMatchObject({ value: 1, n: 30, status: "pass" });
  expect(t.lines.find((l) => l.name.startsWith("Agreement"))!.status).toBe("not_estimable");
});
