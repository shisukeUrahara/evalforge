import { z } from "zod";
import { basicChecks } from "../checks/basic";
import { expectedChecks } from "../checks/expected";
import { buildContext } from "../context/build";
import type { Rule } from "../context/northstar";
import type { Slice } from "../context/slices";
import { AnswerOutput, type Case } from "../domain/schemas";
import { runMany } from "../llm/batch";
import type { ModelRole } from "../llm/config";
import { TransportError } from "../llm/errors";
import type { CallRequest, Gateway } from "../llm/gateway";
import { renderMessages } from "../llm/runner";
import type { PromptVersion } from "../prompts/registry";
import { scoreOutput } from "./output";

export interface ArmInput {
  arm: string;
  prompt: PromptVersion;
  role: ModelRole;
}

export const OutputRow = z.object({
  case_id: z.string(),
  arm: z.string(),
  repeat: z.number().int(),
  context_ref: z.string(),
  cache_key: z.string().nullable(),
  /** Set when the call never produced model output; such rows are excluded from quality numbers. */
  transport: z.string().nullable(),
  raw_text: z.string().nullable(),
  finish_reason: z.string().nullable(),
  refusal: z.string().nullable(),
  usage: z.object({ input_tokens: z.number(), output_tokens: z.number() }),
  latency_ms: z.number(),
  attempts: z.number().int(),
  cached: z.boolean(),
  output_code: z.string(),
  output: AnswerOutput.nullable(),
  checks: z.array(z.object({ code: z.string(), detail: z.string() })),
});
export type OutputRow = z.infer<typeof OutputRow>;

/**
 * Runs every arm on every case R times with the same frozen context, through
 * the cached, budgeted gateway. Deterministic checks are scored here; the judge
 * adds claim verdicts later. Transport failures become rows, not crashes.
 */
export async function runPaired(opts: {
  cases: readonly Case[];
  arms: readonly ArmInput[];
  repeats: number;
  slices: ReadonlyMap<string, Slice>;
  rules: ReadonlyMap<string, Rule>;
  gateway: Gateway;
  concurrency?: number;
}): Promise<OutputRow[]> {
  const jobs: { c: Case; arm: ArmInput; repeat: number; ref: string; req: CallRequest }[] = [];
  for (const c of opts.cases) {
    const ctx = buildContext(c.context_slice_ids, opts.slices);
    for (const arm of opts.arms) {
      const messages = await renderMessages(arm.prompt.messages, { context: ctx.text, question: c.question });
      for (let repeat = 0; repeat < opts.repeats; repeat++) {
        jobs.push({ c, arm, repeat, ref: ctx.ref, req: { role: arm.role, messages, schema: AnswerOutput, schemaName: "support_answer", arm: arm.arm, repeat } });
      }
    }
  }
  const results = await runMany(opts.gateway, jobs.map((j) => j.req), opts.concurrency ?? 4);
  return jobs.map((j, i) => {
    const r = results[i];
    const base = { case_id: j.c.id, arm: j.arm.arm, repeat: j.repeat, context_ref: j.ref };
    if (r instanceof Error) {
      // Budget and cache-miss errors stop the run: they are not model behaviour.
      if (!(r instanceof TransportError)) throw r;
      const t = r;
      return { ...base, cache_key: null, transport: t.code, raw_text: null, finish_reason: null, refusal: null, usage: { input_tokens: 0, output_tokens: 0 }, latency_ms: 0, attempts: 0, cached: false, output_code: t.code, output: null, checks: [] };
    }
    const scored = scoreOutput(r);
    const basic = basicChecks(j.c, scored);
    const checks = [...basic.failures, ...(scored.code === "ok" ? expectedChecks(j.c, scored.output, opts.rules) : [])];
    return { ...base, cache_key: r.cache_key, transport: null, raw_text: r.raw_text, finish_reason: r.finish_reason, refusal: r.refusal, usage: r.usage, latency_ms: r.latency_ms, attempts: r.attempts, cached: r.cached, output_code: scored.code, output: scored.code === "ok" ? scored.output : null, checks };
  });
}

/** 2 of 3 (any strict majority) passes. */
export const majority = (passes: readonly boolean[]) => passes.filter(Boolean).length * 2 > passes.length;

export function median(xs: readonly number[]): number {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** Case ids where any arm had a transport failure: dropped from every arm, reported separately. */
export function droppedCases(rows: readonly OutputRow[]): Set<string> {
  return new Set(rows.filter((r) => r.transport !== null).map((r) => r.case_id));
}
