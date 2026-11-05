import { DirtyTreeError, PreregistrationError } from "@/core/artifacts/guard";
import { ForbiddenError } from "@/core/auth/roles";
import { NotWaivableError } from "@/core/gate/logs";
import type { Command, Deps } from "./deps";
import { applyCaseReviewCmd } from "./commands/applyCaseReview";
import { canaries } from "./commands/canaries";
import { doctor } from "./commands/doctor";
import { draftCases } from "./commands/draftCases";
import { freezeSplit } from "./commands/freezeSplit";
import { judge } from "./commands/judge";
import { applyLabels, labelSheet } from "./commands/labels";
import { report } from "./commands/report";
import { run } from "./commands/run";
import { confirm, waive } from "./commands/waive";
import { verify } from "./commands/verify";
import { EXIT } from "./exit";

/** Commands are added one per commit as the pipeline grows. */
export const COMMANDS: Record<string, Command> = {
  doctor,
  verify,
  "draft-cases": draftCases,
  "apply-case-review": applyCaseReviewCmd,
  "freeze-split": freezeSplit,
  run,
  judge,
  canaries,
  "label-sheet": labelSheet,
  "apply-labels": applyLabels,
  report,
  waive,
  confirm,
};

export async function main(argv: string[], deps: Deps, commands = COMMANDS): Promise<number> {
  const [name, ...rest] = argv;
  const command = name === undefined || name === "help" ? undefined : commands[name];
  if (!command) {
    deps.err(`usage: ef <${Object.keys(commands).join("|")}> [options]`);
    return name === "help" ? EXIT.OK : EXIT.USAGE;
  }
  try {
    return await command(rest, deps);
  } catch (e) {
    // A holdout run refused by the guard is an expected outcome, not a crash.
    if (e instanceof ForbiddenError || e instanceof NotWaivableError) {
      deps.err(e.message);
      return EXIT.FORBIDDEN;
    }
    if (e instanceof DirtyTreeError || e instanceof PreregistrationError) {
      deps.err(e.message);
      return EXIT.DIRTY_TREE;
    }
    // parseArgs rejects unknown or malformed options with an ERR_PARSE_ARGS_* code.
    if (e instanceof Error && "code" in e && String(e.code).startsWith("ERR_PARSE_ARGS")) {
      deps.err(e.message);
      return EXIT.USAGE;
    }
    throw e;
  }
}
