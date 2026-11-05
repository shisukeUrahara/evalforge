import { cookies } from "next/headers";
import type { UserName } from "@/core/auth/roles";
import { USER_COOKIE, userFromCookie } from "./user";

/** The demo user for server components and server actions. */
export async function pageUser(): Promise<UserName> {
  return userFromCookie((await cookies()).get(USER_COOKIE)?.value);
}
