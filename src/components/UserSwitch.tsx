"use client";
import { useRouter } from "next/navigation";
import { USER_COOKIE } from "@/app/_lib/user";
import { USERS, type UserName } from "@/core/auth/roles";

/** Demo identity picker. Sets the cookie the server reads, then re-renders with the new rights. */
export function UserSwitch({ user }: { user: UserName }) {
  const router = useRouter();
  return (
    <label className="flex h-10 items-center rounded-full border border-line bg-surface/70 px-3 font-mono text-xs text-muted">
      <span className="sr-only">Demo user</span>
      <select
        value={user}
        onChange={(e) => {
          document.cookie = `${USER_COOKIE}=${e.target.value}; path=/; samesite=lax; max-age=31536000`;
          router.refresh();
        }}
        className="h-8 cursor-pointer bg-transparent text-ink focus:outline-none"
      >
        {(Object.keys(USERS) as UserName[]).map((u) => (
          <option key={u} value={u}>
            {u} · {USERS[u].title}
          </option>
        ))}
      </select>
    </label>
  );
}
