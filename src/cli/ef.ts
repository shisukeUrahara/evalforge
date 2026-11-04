import { existsSync } from "node:fs";
import path from "node:path";
import { loadPricing } from "@/core/cost/pricing";
import { loadEnv } from "@/core/env";
import { ResponseCache } from "@/core/llm/cache";
import { loadModelRoles } from "@/core/llm/config";
import { Gateway } from "@/core/llm/gateway";
import { Budget } from "@/core/runner/budget";
import { main } from "./main";

// Node built-in; does not override variables that are already set.
if (existsSync(".env")) process.loadEnvFile(".env");
const env = loadEnv(process.env);

main(process.argv.slice(2), {
  dataDir: env.dataDir,
  replay: env.mode === "replay",
  roles: () => loadModelRoles(env.dataDir),
  makeGateway: (maxUsd) => {
    const pricing = loadPricing(path.join(env.dataDir, "pricing.json"));
    const cache = new ResponseCache(path.join(env.dataDir, "cache", "responses"));
    return new Gateway(cache, env.apiKey ? { apiKey: env.apiKey, pricing, budget: new Budget(pricing, maxUsd) } : null);
  },
  now: () => new Date(),
  out: (line) => console.log(line),
  err: (line) => console.error(line),
}).then((code) => process.exit(code));
