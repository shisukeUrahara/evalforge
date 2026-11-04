import { AnswerOutput } from "../domain/schemas";

export type OutputCode = "ok" | "schema_invalid" | "schema_truncated" | "model_refusal";

export type ScoredOutput = { code: "ok"; output: AnswerOutput } | { code: Exclude<OutputCode, "ok">; detail: string };

/**
 * Turns what the model said into a typed answer or a named schema failure.
 * The raw text is never dropped by the caller; this only decides its code.
 */
export function scoreOutput(raw: { raw_text: string | null; finish_reason: string | null; refusal: string | null }): ScoredOutput {
  if (raw.refusal) return { code: "model_refusal", detail: raw.refusal };
  if (raw.finish_reason === "length") return { code: "schema_truncated", detail: "hit the output token limit" };
  if (raw.raw_text === null) return { code: "schema_invalid", detail: "empty output" };
  let json: unknown;
  try {
    json = JSON.parse(raw.raw_text);
  } catch (e) {
    return { code: "schema_invalid", detail: `not JSON: ${(e as Error).message}` };
  }
  const parsed = AnswerOutput.safeParse(json);
  if (!parsed.success) return { code: "schema_invalid", detail: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ") };
  return { code: "ok", output: parsed.data };
}
