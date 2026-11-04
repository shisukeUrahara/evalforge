import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { sha256Hex } from "../prompts/canonical";
import { RunManifest } from "./manifest";

/** `20261104T101500Z-holdout-B`. Sorts by time and is a safe folder name. */
export function runId(createdAt: Date, split: string, candidate: string): string {
  return `${createdAt.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}-${split}-${candidate}`;
}

const SAFE_ID = /^[0-9A-Za-z_-]+$/;
export const runsDir = (dataDir: string) => path.join(dataDir, "runs");

/** Writes the files, then checksums.txt over them (sha256sum -c compatible). */
export function writeRunFolder(dir: string, files: Record<string, string>): void {
  mkdirSync(dir, { recursive: true });
  for (const [name, body] of Object.entries(files)) writeFileSync(path.join(dir, name), body);
  const lines = Object.keys(files)
    .sort()
    .map((name) => `${sha256Hex(readFileSync(path.join(dir, name), "utf8"))}  ${name}`);
  writeFileSync(path.join(dir, "checksums.txt"), lines.join("\n") + "\n");
}

/** Finished runs, newest first. Folders without a manifest (fixtures, partial runs) are skipped. */
export function listRuns(dataDir: string): { id: string; manifest: RunManifest }[] {
  const root = runsDir(dataDir);
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && SAFE_ID.test(e.name) && existsSync(path.join(root, e.name, "manifest.json")))
    .map((e) => ({ id: e.name, manifest: RunManifest.parse(JSON.parse(readFileSync(path.join(root, e.name, "manifest.json"), "utf8"))) }))
    .sort((a, b) => b.manifest.created_at_utc.localeCompare(a.manifest.created_at_utc) || b.id.localeCompare(a.id));
}

/** Reads one file of a run; refuses ids and names that are not plain. */
export function readRunFile(dataDir: string, id: string, file: string): string | null {
  if (!SAFE_ID.test(id) || !/^[\w.-]+$/.test(file)) return null;
  const p = path.join(runsDir(dataDir), id, file);
  return existsSync(p) ? readFileSync(p, "utf8") : null;
}
