import path from "node:path";
import { Case } from "../domain/schemas";
import { canonicalJson, sha256Hex } from "../prompts/canonical";
import { readJsonl } from "./jsonl";

export const datasetDir = (dataDir: string, name: string) => path.join(dataDir, "data", "datasets", name);

export function loadCases(dataDir: string, name: string): Case[] {
  return readJsonl(path.join(datasetDir(dataDir, name), "cases.jsonl"), Case);
}

/** Hash of the cases in id order. Any edit to any case changes it. */
export function datasetSha(cases: readonly Case[]): string {
  return sha256Hex(canonicalJson([...cases].sort((a, b) => (a.id < b.id ? -1 : 1))));
}
