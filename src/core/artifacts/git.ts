import { execFileSync } from "node:child_process";

export interface RepoState {
  git_sha: string;
  git_dirty: boolean;
  /** Last commit touching each pre-registration file, or null if it was never committed. */
  preregistration: Record<string, string | null>;
}

export class NotAGitRepoError extends Error {
  constructor(dir: string) {
    super(`${dir} is not a git checkout with at least one commit. Run holdout evaluations on the host, not in a container.`);
    this.name = "NotAGitRepoError";
  }
}

/** Fixed before any holdout run: the labeling rules and the gate thresholds. */
export const PREREGISTRATION_FILES = ["docs/labeling_guide.md", "gate/rules.v1.json"] as const;

const git = (cwd: string, args: string[]) => execFileSync("git", ["-C", cwd, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();

/** Where the code is right now. Untracked files count as dirty. Throws outside a checkout. */
export function repoState(cwd: string): RepoState {
  let sha: string;
  try {
    sha = git(cwd, ["rev-parse", "HEAD"]);
  } catch {
    throw new NotAGitRepoError(cwd);
  }
  return {
    git_sha: sha,
    git_dirty: git(cwd, ["status", "--porcelain"]) !== "",
    preregistration: Object.fromEntries(PREREGISTRATION_FILES.map((f) => [f, git(cwd, ["log", "-1", "--format=%H", "--", f]) || null])),
  };
}
