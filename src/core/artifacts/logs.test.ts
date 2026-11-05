import { appendFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { expect, test } from "vitest";
import { z } from "zod";
import { logHead, readLogAt } from "./logs";

const Row = z.object({ n: z.number() });

test("reading at a head ignores later lines and catches a rewritten prefix", () => {
  const f = path.join(mkdtempSync(path.join(tmpdir(), "ef-")), "log.jsonl");
  writeFileSync(f, '{"n":1}\n{"n":2}\n');
  const head = logHead(f);
  appendFileSync(f, '{"n":3}\n');
  expect(readLogAt(f, Row, head)).toEqual([{ n: 1 }, { n: 2 }]);
  expect(readLogAt(f, Row)).toHaveLength(3);
  writeFileSync(f, '{"n":9}\n{"n":2}\n{"n":3}\n');
  expect(() => readLogAt(f, Row, head)).toThrow(/changed since/);
  expect(logHead(path.join(path.dirname(f), "none.jsonl")).lines).toBe(0);
});
