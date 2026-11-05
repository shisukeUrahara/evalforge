"use client";
import { useActionState } from "react";
import { Denied } from "@/components/Denied";

export type ActionState = { status: "idle" } | { status: "ok"; message: string } | { status: "error"; message: string } | { status: "denied"; user: string; action: string };
type Action = (prev: ActionState, form: FormData) => Promise<ActionState>;

const IDLE: ActionState = { status: "idle" };

function Result({ state }: { state: ActionState }) {
  if (state.status === "denied") return <Denied user={state.user} action={state.action} />;
  if (state.status === "idle") return null;
  return (
    <p role="status" className={`text-sm ${state.status === "ok" ? "text-success" : "text-danger"}`}>
      {state.message}
    </p>
  );
}

/** "Ship anyway" for one failing priority check. Opens first, so a waiver is never one stray click. */
export function WaiveForm({ run, check, action }: { run: string; check: string; action: Action }) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  return (
    <details className="mt-3 rounded-xl border border-line bg-surface/60 p-3">
      <summary className="flex min-h-11 cursor-pointer items-center text-sm font-medium text-warn">Waive this check…</summary>
      <form action={formAction} className="mt-2 space-y-2">
        <input type="hidden" name="run" value={run} />
        <input type="hidden" name="check" value={check} />
        <label className="block text-sm">
          <span className="text-muted">Reason (at least 10 characters; it is logged with your name)</span>
          <textarea name="reason" required minLength={10} rows={2} className="mt-1 block w-full rounded-lg border border-line bg-surface-2 p-2 text-sm text-ink" />
        </label>
        <button type="submit" disabled={pending} className="min-h-11 rounded-[10px] border border-warn/60 px-4 text-sm font-medium text-warn hover:bg-warn-bg disabled:opacity-60">
          {pending ? "Recording…" : "Record waiver and re-run gate"}
        </button>
        <Result state={state} />
      </form>
    </details>
  );
}

/** A human decides one judge-flagged critical case while the judge is not trusted. */
export function ConfirmForm({ run, caseId, action }: { run: string; caseId: string; action: Action }) {
  const [state, formAction, pending] = useActionState(action, IDLE);
  return (
    <form action={formAction} className="mt-2 space-y-2 rounded-xl border border-warn/40 p-3">
      <input type="hidden" name="run" value={run} />
      <input type="hidden" name="case" value={caseId} />
      <p className="text-sm">
        Is the flagged claim in <span className="font-mono">{caseId}</span> unsupported?
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="submit" name="decision" value="unsupported" disabled={pending} className="min-h-11 rounded-[10px] border border-danger/60 px-4 text-sm text-danger hover:bg-danger-bg">
          Yes, unsupported
        </button>
        <button type="submit" name="decision" value="not_unsupported" disabled={pending} className="min-h-11 rounded-[10px] border border-line px-4 text-sm hover:bg-surface-2">
          No, it is fine
        </button>
      </div>
      <Result state={state} />
    </form>
  );
}
