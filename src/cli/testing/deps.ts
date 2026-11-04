import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { loadPricing } from "@/core/cost/pricing";
import { ResponseCache } from "@/core/llm/cache";
import { loadModelRoles } from "@/core/llm/config";
import { Gateway } from "@/core/llm/gateway";
import { Budget } from "@/core/runner/budget";
import type { Deps } from "../deps";

/** Test deps: real config from the repo, a temp cache, and an optional mock server for live calls. */
export function testDeps(opts: { dataDir?: string; baseURL?: string; cacheDir?: string } = {}) {
  const out: string[] = [];
  const err: string[] = [];
  const pricing = loadPricing("pricing.json");
  const cacheDir = opts.cacheDir ?? path.join(mkdtempSync(path.join(tmpdir(), "ef-")), "responses");
  const deps: Deps = {
    dataDir: opts.dataDir ?? process.cwd(),
    replay: !opts.baseURL,
    roles: () => loadModelRoles(process.cwd()),
    makeGateway: (maxUsd) =>
      new Gateway(new ResponseCache(cacheDir), opts.baseURL ? { apiKey: "sk-test", pricing, budget: new Budget(pricing, maxUsd), baseURL: opts.baseURL, retry: { timeoutMs: 2000, backoffMs: [] } } : null, () => new Date(0)),
    now: () => new Date(0),
    out: (l) => out.push(l),
    err: (l) => err.push(l),
  };
  return { deps, out, err, cacheDir };
}
