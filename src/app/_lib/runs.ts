import { RunManifest } from "@/core/artifacts/manifest";
import { readRunFile } from "@/core/artifacts/runs";

/** The manifest of a run folder, or null for an unknown or unreadable id. */
export function runManifest(dataDir: string, id: string): RunManifest | null {
  const t = readRunFile(dataDir, id, "manifest.json");
  if (!t) return null;
  const p = RunManifest.safeParse(JSON.parse(t));
  return p.success ? p.data : null;
}
