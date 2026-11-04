import { readFileSync } from "node:fs";
import type { Msg } from "../llm/runner";

/**
 * A prompt file is Markdown with "## system" and "## user" sections. Placeholders
 * use mustache ({{var}}), so literal JSON braces in the text are safe.
 */
export function parsePromptFile(markdown: string): Msg[] {
  const parts = markdown.split(/^## (system|user)\s*$/m);
  const msgs: Msg[] = [];
  for (let i = 1; i < parts.length; i += 2) msgs.push({ role: parts[i] as Msg["role"], content: parts[i + 1].trim() });
  if (msgs.length === 0) throw new Error("prompt file has no '## system' or '## user' section");
  return msgs;
}

export const loadPromptFile = (file: string): Msg[] => parsePromptFile(readFileSync(file, "utf8"));
