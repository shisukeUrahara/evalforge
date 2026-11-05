import { existsSync, readFileSync } from "node:fs";
import type { z } from "zod";
import { sha256Hex } from "../prompts/canonical";

/** How much of an append-only log a result used: line count + sha of exactly those lines. */
export interface LogHead {
  lines: number;
  sha: string;
}

const linesOf = (file: string) => (existsSync(file) ? readFileSync(file, "utf8").split("\n").filter((l) => l.trim() !== "") : []);

export function logHead(file: string): LogHead {
  const lines = linesOf(file);
  return { lines: lines.length, sha: sha256Hex(lines.join("\n")) };
}

/**
 * Reads an append-only log up to a recorded head, so a later waiver, confirm or
 * label cannot change a reproduced result. Throws if the prefix was rewritten.
 */
export function readLogAt<S extends z.ZodType>(file: string, schema: S, head?: LogHead): z.infer<S>[] {
  let lines = linesOf(file);
  if (head) {
    if (lines.length < head.lines) throw new Error(`${file}: has ${lines.length} lines, the result used ${head.lines}`);
    lines = lines.slice(0, head.lines);
    if (sha256Hex(lines.join("\n")) !== head.sha) throw new Error(`${file}: the first ${head.lines} lines changed since the result was made`);
  }
  return lines.map((l, i) => {
    const p = schema.safeParse(JSON.parse(l));
    if (!p.success) throw new Error(`${file}:${i + 1}: ${p.error.message}`);
    return p.data;
  });
}
