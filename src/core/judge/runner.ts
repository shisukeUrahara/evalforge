import { z } from "zod";
import type { Slice } from "../context/slices";
import { JudgeOutput, type Case } from "../domain/schemas";
import { runMany } from "../llm/batch";
import type { ModelRole } from "../llm/config";
import type { Gateway } from "../llm/gateway";
import type { PromptVersion } from "../prompts/registry";
import type { OutputRow } from "../run/paired";
import { judgeRequest, parseJudgment } from "./claims";

export const JudgmentRow = z.object({
  case_id: z.string(),
  arm: z.string(),
  repeat: z.number().int(),
  judge: z.string(),
  judge_sha: z.string(),
  status: z.enum(["ok", "judge_error"]),
  output: JudgeOutput.nullable(),
  detail: z.string().nullable(),
  cached: z.boolean(),
  usage: z.object({ input_tokens: z.number(), output_tokens: z.number() }),
});
export type JudgmentRow = z.infer<typeof JudgmentRow>;

/**
 * Judges every answer that passed the schema. Answers that failed it are not
 * judged (they already fail). Judge transport failures and bad replies become
 * judge_error rows; budget and cache-miss errors stop the run.
 */
export async function judgeOutputs(opts: { rows: readonly OutputRow[]; cases: ReadonlyMap<string, Case>; slices: ReadonlyMap<string, Slice>; prompt: PromptVersion; role: ModelRole; gateway: Gateway }): Promise<JudgmentRow[]> {
  const todo = opts.rows.filter((r) => r.output !== null);
  const reqs = await Promise.all(todo.map((r) => judgeRequest(opts.cases.get(r.case_id)!, r, opts.slices, opts.prompt, opts.role)));
  const results = await runMany(opts.gateway, reqs, 4);
  return todo.map((r, i) => {
    const res = results[i];
    const base = { case_id: r.case_id, arm: r.arm, repeat: r.repeat, judge: opts.prompt.name, judge_sha: opts.prompt.sha };
    if (res instanceof Error) {
      if (res.name !== "TransportError") throw res;
      return { ...base, status: "judge_error" as const, output: null, detail: res.message, cached: false, usage: { input_tokens: 0, output_tokens: 0 } };
    }
    const j = parseJudgment(res);
    return { ...base, status: j.status, output: j.status === "ok" ? j.output : null, detail: j.status === "ok" ? null : j.detail, cached: res.cached, usage: res.usage };
  });
}
