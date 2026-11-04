import { verifySources } from "@/core/context/verify";
import type { Command } from "../deps";
import { EXIT } from "../exit";

/** Committed sources match their checksums; exit 1 names every mismatch. */
export const verify: Command = async (_argv, deps) => {
  const problems = verifySources(deps.dataDir);
  for (const p of problems) deps.err(p);
  if (problems.length > 0) return EXIT.CHECK_FAILED;
  deps.out("sources verified: Stripe slices match their checksums, Northstar policies carry the SYNTHETIC notice");
  return EXIT.OK;
};
