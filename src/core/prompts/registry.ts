import { readFileSync } from "node:fs";
import path from "node:path";
import type { Msg } from "../llm/runner";
import { sha256Hex } from "./canonical";
import { parsePromptFile } from "./file";

export interface PromptVersion {
  /** e.g. "A.v1" */
  name: string;
  /** sha256 of the file text: same text, same sha; any edit is a new version. */
  sha: string;
  text: string;
  messages: Msg[];
}

/** Prompt versions are files in data/prompts/<name>.md. Editing one in place changes its sha, visibly. */
export function loadPrompt(dataDir: string, name: string): PromptVersion {
  if (!/^[A-Za-z]+\.v\d+$/.test(name)) throw new Error(`prompt name must look like A.v1, got "${name}"`);
  const text = readFileSync(path.join(dataDir, "data", "prompts", `${name}.md`), "utf8");
  return { name, sha: sha256Hex(text), text, messages: parsePromptFile(text) };
}
