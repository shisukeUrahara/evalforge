/** Demo users. maya can look; lee (release manager) can also waive and confirm. Not real auth. */
export const USERS = {
  maya: { name: "maya", title: "viewer", can: [] as string[] },
  lee: { name: "lee", title: "release manager", can: ["waive", "confirm"] },
} as const;
export type UserName = keyof typeof USERS;

export const isUser = (x: string): x is UserName => x in USERS;

export class ForbiddenError extends Error {
  constructor(user: string, action: string) {
    super(`${user} may not ${action}. Only lee (release manager) can.`);
    this.name = "ForbiddenError";
  }
}

export function requireAction(user: string, action: "waive" | "confirm"): UserName {
  if (!isUser(user) || !(USERS[user].can as readonly string[]).includes(action)) throw new ForbiddenError(user, action);
  return user;
}
