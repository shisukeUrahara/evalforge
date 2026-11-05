import { expect, test } from "vitest";
import { compareGates } from "./compare";

test("with no human labels the two gates are identical", () => {
  const heads = { labels: { lines: 0, sha: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" }, waivers: { lines: 0, sha: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" }, confirms: { lines: 0, sha: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855" } };
  const c = compareGates(process.cwd(), "20261105T043553Z-holdout-B", "20261105T043647Z-holdout-A2", heads);
  expect(c.changed).toBe(false);
  expect(c.judge_only.decision).toBe("block");
});
