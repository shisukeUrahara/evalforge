import { ChevronRight } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArmDot } from "@/components/Arm";
import { RangeBar } from "@/components/ui/charts";
import { Pill, type Tone } from "@/components/ui/Pill";
import type { GateCheck } from "@/core/domain/schemas";
import type { TrustLine } from "@/core/metrics/trust";
import type { GateView } from "@/core/views/gate";

export const DECISION: Record<GateView["decision"], { word: string; tone: "success" | "warn" | "danger" }> = {
  ship: { word: "SHIP", tone: "success" },
  block: { word: "BLOCK", tone: "danger" },
  pending_confirm: { word: "PENDING CONFIRM", tone: "warn" },
};

export const STATUS: Record<GateCheck["status"], { label: string; tone: Tone }> = {
  pass: { label: "pass", tone: "success" },
  fail: { label: "FAIL", tone: "danger" },
  warn: { label: "warn", tone: "warn" },
  pending_confirm: { label: "PENDING CONFIRM", tone: "warn" },
  failed_waived: { label: "failed + waived", tone: "waived" },
};

const TIER = { critical: "CRIT", priority: "PRIO", warn: "WARN" } as const;
const INK = { success: "text-success", warn: "text-warn", danger: "text-danger" } as const;

export const caseHref = (run: string, id: string) => `/compare?run=${encodeURIComponent(run)}&case=${encodeURIComponent(id)}`;

/** B / M / C as a segmented control. Scrolls sideways on a phone instead of hiding C. */
export function CandidateSwitch({ v }: { v: GateView }) {
  return (
    <nav aria-label="Candidate" className="overflow-x-auto rounded-2xl border border-line bg-surface/70 p-1">
      <ul className="flex min-w-max gap-1">
        {v.candidates.map((c) => (
          <li key={c.arm} className="flex-1">
            <Link
              href={`/?c=${c.arm}`}
              aria-current={c.arm === v.selected.arm ? "page" : undefined}
              className="flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm text-muted transition-colors hover:text-ink aria-[current=page]:bg-primary aria-[current=page]:font-medium aria-[current=page]:text-primary-ink"
            >
              <ArmDot arm={c.arm} />
              {c.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function VerdictBanner({ v }: { v: GateView }) {
  const d = DECISION[v.decision];
  const c = v.counts;
  return (
    <section aria-label="Gate verdict" className={`fade-up grid gap-5 rounded-[20px] border bg-surface/85 p-6 shadow-card md:grid-cols-[1fr_auto] md:p-7 ${d.tone === "success" ? "border-success/40" : d.tone === "warn" ? "border-warn/40" : "border-danger/40"}`}>
      <div>
        <p className="micro">Gate verdict</p>
        <h1 className={`display mt-2 text-5xl font-medium md:text-6xl ${INK[d.tone]}`}>{d.word}</h1>
      </div>
      <div className="space-y-1.5 text-sm md:border-l md:border-line md:pl-6">
        <p className="text-muted">
          Candidate <span className="text-ink">{v.selected.arm}</span> vs baseline <span className="text-ink">A</span> · {v.selected.kind}
        </p>
        <p className="text-muted">
          What changed: <span className="text-ink">{v.what_changed}</span>
        </p>
        <p className="num text-muted">
          {c.checks} checks · <span className={c.failed ? "text-danger" : ""}>{c.failed} failed</span> · <span className={c.warnings ? "text-warn" : ""}>{c.warnings} warnings</span>
          {c.pending > 0 && <span className="text-warn"> · {c.pending} pending confirm</span>}
        </p>
        <p className="break-all font-mono text-xs text-muted">run id: {v.selected.run_id}</p>
      </div>
    </section>
  );
}

export function CheckRow({ check, runId, children }: { check: GateCheck; runId: string; children?: ReactNode }) {
  const s = STATUS[check.status];
  const bad = check.status === "fail" || check.status === "pending_confirm";
  return (
    <li className={`rounded-2xl border px-4 py-3 ${bad ? (check.status === "fail" ? "border-danger/40 bg-danger-bg/40" : "border-warn/40 bg-warn-bg/40") : "border-line bg-surface-2/40"}`}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <Pill>{TIER[check.tier]}</Pill>
        <span className="min-w-0 flex-1 break-all font-mono text-sm">{check.reason_code}</span>
        <Pill tone={s.tone}>{s.label}</Pill>
      </div>
      <p className="mt-2 text-sm text-muted">{check.detail}</p>
      {check.case_ids.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="micro mr-1">cases</span>
          {check.case_ids.map((id) => (
            <Link key={id} href={caseHref(runId, id)} className="inline-flex min-h-7 items-center gap-0.5 rounded-md bg-surface-2 px-2 font-mono text-xs text-ink hover:bg-brand-bg hover:text-brand">
              {id}
              <ChevronRight aria-hidden className="size-3" />
            </Link>
          ))}
          <span className="micro ml-1">· label source: {check.label_source}</span>
        </div>
      )}
      {children}
    </li>
  );
}

const fmt = (x: number | null) => (x === null ? "" : x.toFixed(2));

/** One line of the trust bar. Not estimable means waiting for human labels: no number is shown. */
export function TrustRow({ line }: { line: TrustLine }) {
  const tone = line.status === "pass" ? "success" : line.status === "fail" ? "danger" : "neutral";
  return (
    <li className="py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm">{line.name}</p>
          <p className="mt-0.5 font-mono text-xs text-muted">
            needs {line.bar}
            {line.status !== "not_estimable" && (
              <>
                {" "}· n={line.n}
                {line.low !== null && line.high !== null && ` · range ${fmt(line.low)}–${fmt(line.high)}`}
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {line.value !== null && line.status !== "not_estimable" && <span className="num font-mono text-sm">{fmt(line.value)}</span>}
          <Pill tone={tone}>{line.status === "not_estimable" ? "waiting for human labels" : line.status}</Pill>
        </div>
      </div>
      {line.value !== null && line.low !== null && line.high !== null && line.status !== "not_estimable" && (
        <div className="mt-2">
          <RangeBar lo={line.low} hi={line.high} point={line.value} label={line.name} barClass={line.status === "pass" ? "bg-success" : "bg-danger"} />
        </div>
      )}
    </li>
  );
}
