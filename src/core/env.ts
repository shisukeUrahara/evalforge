import { z } from "zod";

const Raw = z.object({
  OPENAI_API_KEY: z.string().trim().optional(),
  EF_DATA_DIR: z.string().trim().optional(),
});

export interface Env {
  /** `live` may call model APIs. `replay` answers only from the committed cache. */
  mode: "live" | "replay";
  apiKey: string | null;
  /** Folder that holds fixtures/, data/, cache/ and runs/. */
  dataDir: string;
}

/** Reads the variables EvalForge knows. A bad value throws and names it. */
export function loadEnv(source: Record<string, string | undefined>, cwd = process.cwd()): Env {
  const parsed = Raw.safeParse(source);
  if (!parsed.success) {
    const names = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
    throw new Error(`invalid environment variable: ${names}`);
  }
  const apiKey = parsed.data.OPENAI_API_KEY || null;
  return { mode: apiKey ? "live" : "replay", apiKey, dataDir: parsed.data.EF_DATA_DIR || cwd };
}

/** Throws a clear message when a command needs the live API but no key is set. */
export function requireLive(env: Env): string {
  if (env.apiKey === null) {
    throw new Error("OPENAI_API_KEY is not set. Put it in .env for live runs, or pass --replay to use the committed cache.");
  }
  return env.apiKey;
}
