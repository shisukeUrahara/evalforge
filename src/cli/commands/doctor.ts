import type { Command } from "../deps";
import { EXIT } from "../exit";

/** Says whether live calls are possible and where data lives. */
export const doctor: Command = async (_argv, deps) => {
  deps.out(deps.replay ? "replay mode: no OPENAI_API_KEY, model calls come from cache/ only" : "live mode, key found");
  deps.out(`data dir: ${deps.dataDir}`);
  return EXIT.OK;
};
