import { cpSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { verifySources } from "./verify";

test("the committed sources verify clean", () => {
  expect(verifySources(process.cwd())).toEqual([]);
});

test("a tampered slice is caught by its checksum", () => {
  const dir = mkdtempSync(path.join(tmpdir(), "ef-"));
  cpSync("fixtures", path.join(dir, "fixtures"), { recursive: true });
  const file = path.join(dir, "fixtures/stripe/slice.json");
  writeFileSync(file, readFileSync(file, "utf8").replace("Cancels a refund", "Cancels any refund"));
  expect(verifySources(dir)).toEqual(["stripe:refunds.cancel: text does not match its checksum"]);
});
