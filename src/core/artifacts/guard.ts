import type { RepoState } from "./git";

export class DirtyTreeError extends Error {
  constructor() {
    super("The working tree has uncommitted changes. Commit them first, or pass --allow-dirty (the manifest will say so).");
    this.name = "DirtyTreeError";
  }
}

export class PreregistrationError extends Error {
  constructor(readonly missing: string[]) {
    super(`${missing.join(" and ")} not committed. Commit the pre-registration before the holdout run. --allow-dirty does not waive this.`);
    this.name = "PreregistrationError";
  }
}

/** The holdout run is the one that gets published: committed code, committed rules. Tuning is free. */
export function guardRun(split: string, state: RepoState, allowDirty: boolean): void {
  if (split !== "holdout") return;
  const missing = Object.entries(state.preregistration).filter(([, sha]) => sha === null).map(([f]) => f);
  if (missing.length) throw new PreregistrationError(missing);
  if (state.git_dirty && !allowDirty) throw new DirtyTreeError();
}
