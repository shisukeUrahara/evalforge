import { buildContext } from "../context/build";
import type { Slice } from "../context/slices";
import { JudgeOutput, type Case } from "../domain/schemas";
import type { ModelRole } from "../llm/config";
import type { CallRequest } from "../llm/gateway";
import { renderMessages } from "../llm/runner";
import type { PromptVersion } from "../prompts/registry";
import type { OutputRow } from "../run/paired";

export type Judgment = { status: "ok"; output: JudgeOutput } | { status: "judge_error"; detail: string };

/**
 * One judge call per answer. The judge sees the same frozen context the answer
 * saw. `arm`/`repeat` mirror the answer's so every answer gets its own cache entry.
 */
export async function judgeRequest(c: Case, row: OutputRow, slices: ReadonlyMap<string, Slice>, prompt: PromptVersion, role: ModelRole): Promise<CallRequest> {
  if (!row.output) throw new Error(`${row.case_id}/${row.arm}: no parsed answer to judge`);
  const ctx = buildContext(c.context_slice_ids, slices);
  const messages = await renderMessages(prompt.messages, { context: ctx.text, question: c.question, answer: row.output.answer });
  return { role, messages, schema: JudgeOutput, schemaName: "claim_judgment", arm: `judge-${row.arm}`, repeat: row.repeat };
}

/**
 * A judge reply that is not valid is a judge_error, never "unsupported":
 * a parse failure must not be able to trigger a critical block.
 */
export function parseJudgment(raw: { raw_text: string | null; finish_reason: string | null; refusal: string | null }): Judgment {
  if (raw.refusal) return { status: "judge_error", detail: `judge refused: ${raw.refusal}` };
  if (raw.finish_reason === "length") return { status: "judge_error", detail: "judge output truncated" };
  try {
    const parsed = JudgeOutput.safeParse(JSON.parse(raw.raw_text ?? ""));
    if (parsed.success) return { status: "ok", output: parsed.data };
    return { status: "judge_error", detail: parsed.error.issues[0]?.message ?? "bad judge output" };
  } catch {
    return { status: "judge_error", detail: "judge output is not JSON" };
  }
}

/** Unsupported material claims in one judged answer: the primary metric's unit. */
export const unsupportedMaterial = (j: JudgeOutput) => j.claims.filter((c) => c.material && c.verdict === "unsupported").length;
