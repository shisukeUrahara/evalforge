import type { ModelRoles } from "@/core/llm/config";
import type { Gateway } from "@/core/llm/gateway";

/** Everything a command touches from the outside world, so tests can fake it. */
export interface Deps {
  /** Folder that holds fixtures/, data/, cache/ and runs/. */
  dataDir: string;
  /** True when there is no API key: every model call must come from the cache. */
  replay: boolean;
  roles: () => ModelRoles;
  /** Cached model gateway; live calls (if any) are capped at maxUsd. */
  makeGateway: (maxUsd: number) => Gateway;
  now: () => Date;
  out: (line: string) => void;
  err: (line: string) => void;
}

export type Command = (argv: string[], deps: Deps) => Promise<number>;
