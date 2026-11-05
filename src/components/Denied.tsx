import { Lock } from "lucide-react";

/** What maya sees when she tries to waive or confirm: the server refused (403). */
export function Denied({ user, action }: { user: string; action: string }) {
  return (
    <div role="alert" className="rounded-2xl border border-danger/30 bg-danger-bg p-4 text-sm text-danger">
      <p className="flex items-center gap-2 font-medium">
        <Lock aria-hidden className="size-4" />
        Not allowed (403)
      </p>
      <p className="mt-1">
        <span className="font-mono">{user}</span> may not {action}. Only <span className="font-mono">lee</span> (release manager) can. Switch user at the top right.
      </p>
    </div>
  );
}
