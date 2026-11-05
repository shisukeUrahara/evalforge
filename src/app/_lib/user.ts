import { USERS, type UserName } from "@/core/auth/roles";

/** Demo identity cookie. Not real auth: anyone can pick lee. The server still checks every action. */
export const USER_COOKIE = "ef_user";

export const userFromCookie = (value: string | undefined): UserName => (value && Object.hasOwn(USERS, value) ? (value as UserName) : "maya");
