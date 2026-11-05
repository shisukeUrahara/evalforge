import Link from "next/link";
import { ArmDot } from "@/components/Arm";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import type { FinalClaim } from "@/core/score/labels";
import type { AnswerView, ComparisonView } from "@/core/views/comparison";
import { segments } from "./highlight";

const VERDICT = { supported: "success", unsupported: "danger", uncertain: "warn" } as const;
const UNDERLINE = { supported: "decoration-success", unsupported: "decoration-danger", uncertain: "decoration-warn" } as const;

/** One claim: verdict pill, the claim text, and who decided it (judge or human). */
function ClaimLine({ c }: { c: FinalClaim }) {
  return (
    <li className="fade-up flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
      <Pill tone={VERDICT[c.verdict]}>{c.verdict}</Pill>
      <span className="min-w-0 flex-1 text-xs text-muted">{c.text}</span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted">{c.source}</span>
    </li>
  );
}

type Selected = NonNullable<ComparisonView["selected"]>;

export const compareHref = (q: { run: string; case?: string; only?: string }) => "/compare?" + new URLSearchParams(Object.entries(q).filter((e): e is [string, string] => !!e[1])).toString();

export function QuestionCard({ s }: { s: Selected }) {
  return (
    <section aria-label="Question" className="rounded-[20px] border border-line bg-surface/85 p-5 shadow-card">
      <div className="flex flex-wrap items-center gap-2">
        <Pill>{s.case.id}</Pill>
        <Pill>{s.case.category}</Pill>
        {s.case.critical && <Pill tone="danger">critical</Pill>}
        {s.case.expected.must_refuse && <Pill tone="warn">should refuse</Pill>}
      </div>
      <h1 className="mt-3 text-lg font-medium md:text-xl">{s.case.question}</h1>
    </section>
  );
}

export function AnswerColumn({ a, unsupported }: { a: AnswerView; unsupported: number }) {
  return (
    <section aria-label={`Answer ${a.arm}`} className="flex min-w-0 flex-col gap-3 rounded-[20px] border border-line bg-surface/85 p-5 shadow-card">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2 font-mono text-xs text-muted">
          <ArmDot arm={a.arm} />
          <span className="break-all">{a.label}</span>
        </span>
        <Pill tone={a.pass ? "success" : "danger"}>{a.pass ? "pass" : "fail"}</Pill>
      </header>
      <div className="rounded-xl bg-surface-2 p-3 text-[15px] leading-relaxed">
        {a.answer !== null ? (
          segments(
            a.answer,
            a.claims.filter((c) => c.material),
          ).map((seg, i) =>
            seg.claim ? (
              <mark key={i} title={`${seg.claim.verdict} (${seg.claim.source})`} className={`bg-transparent text-ink underline decoration-2 underline-offset-4 ${UNDERLINE[seg.claim.verdict]}`}>
                {seg.text}
              </mark>
            ) : (
              <span key={i}>{seg.text}</span>
            ),
          )
        ) : (
          <span className="text-danger">
            No valid answer (<span className="font-mono">{a.output_code}</span>)
          </span>
        )}
      </div>
      {a.claims.some((c) => c.material) && (
        <ul aria-label="Material claims" className="space-y-2">
          {a.claims
            .filter((c) => c.material)
            .map((c, i) => (
              <ClaimLine key={i} c={c} />
            ))}
        </ul>
      )}
      {a.claims.some((c) => !c.material) && <p className="text-xs text-muted">+ {a.claims.filter((c) => !c.material).length} non-material claim(s), not scored</p>}
      <dl className="flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs">
        <div className="flex items-center gap-1.5">
          <dt className="text-muted">refused:</dt>
          <dd>{a.refused === null ? "n/a" : a.refused ? "yes" : "no"}</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt className="text-muted">unsupported:</dt>
          <dd className={unsupported ? "text-danger" : ""}>{unsupported}</dd>
        </div>
        <div className="flex w-full flex-wrap items-center gap-1.5">
          <dt className="text-muted">cited:</dt>
          {a.cited.length === 0 ? (
            <dd className="text-muted">none</dd>
          ) : (
            a.cited.map((id) => (
              <dd key={id} className="break-all rounded-md bg-brand-bg px-1.5 py-0.5 text-brand">
                {id}
              </dd>
            ))
          )}
        </div>
      </dl>
      {a.checks.length > 0 && (
        <ul aria-label="Failed checks" className="space-y-1 border-t border-line pt-3">
          {a.checks.map((c) => (
            <li key={c.code} className="text-sm">
              <span className="font-mono text-xs text-danger">{c.code}</span> <span className="text-muted">{c.detail}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function Provenance({ v }: { v: ComparisonView }) {
  const s = v.selected!;
  return (
    <div className="space-y-6">
      <Card title="Source slices" hint={`${s.sources.length} slice${s.sources.length === 1 ? "" : "s"} in this case's frozen context`}>
        <ul className="space-y-3">
          {s.sources.map((src) => (
            <li key={src.id} className="rounded-xl bg-surface-2 p-3">
              <p className="text-sm font-medium">{src.title}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                <span className="break-all rounded-md bg-brand-bg px-1.5 py-0.5 font-mono text-[11px] text-brand">{src.id}</span>
                <Pill>{src.license}</Pill>
                <Pill>{src.pin}</Pill>
              </div>
              <p className="mt-2 whitespace-pre-line text-sm text-muted">{src.text}</p>
            </li>
          ))}
        </ul>
      </Card>
      <Card title="Run manifest">
        <dl className="divide-y divide-line font-mono text-xs">
          {v.manifest.map((m) => (
            <div key={m.key} className="flex justify-between gap-3 py-1.5">
              <dt className="shrink-0 text-muted">{m.key}</dt>
              <dd className="min-w-0 break-all text-right">{m.value}</dd>
            </div>
          ))}
        </dl>
      </Card>
      <Card title="Prompt diff">
        {v.prompt_diff.length === 0 ? (
          <p className="text-sm text-muted">Same prompt in both arms: this run changes only the model.</p>
        ) : (
          <pre aria-label="Prompt diff, baseline to candidate" className="max-h-96 overflow-auto rounded-xl bg-surface-2 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap">
            {v.prompt_diff.map((l, i) => (
              <span key={i} className={`block ${l.op === "+" ? "text-success" : l.op === "-" ? "text-danger" : "text-muted"}`}>
                {l.op === " " ? " " : l.op} {l.text}
              </span>
            ))}
          </pre>
        )}
      </Card>
    </div>
  );
}

/** Case list with the "regressions only" filter (?only=reg). */
export function CaseList({ v, only }: { v: ComparisonView; only?: string }) {
  const s = v.selected!;
  const cand = s.candidate.arm;
  const reg = only === "reg";
  const rows = reg ? v.rows.filter((r) => r.regression) : v.rows;
  return (
    <section aria-label="Cases" className="overflow-hidden rounded-[20px] border border-line bg-surface/85 shadow-card">
      <header className="flex items-center justify-between gap-2 px-4 pb-2 pt-4">
        <h2 className="font-display text-base font-medium">Cases</h2>
        <Link
          href={compareHref({ run: v.run_id, case: s.case.id, only: reg ? undefined : "reg" })}
          aria-current={reg ? "true" : undefined}
          className="flex min-h-9 items-center gap-2 text-xs text-muted hover:text-ink aria-[current=true]:text-brand"
        >
          <span aria-hidden className={`grid size-4 place-items-center rounded border ${reg ? "border-brand bg-brand text-primary-ink" : "border-line"}`}>
            {reg ? "✓" : ""}
          </span>
          Regressions only
        </Link>
      </header>
      <ul className="divide-y divide-line lg:max-h-[calc(100dvh-14rem)] lg:overflow-y-auto">
        {rows.map((r) => (
          <li key={r.case_id}>
            <Link
              href={compareHref({ run: v.run_id, case: r.case_id, only })}
              aria-current={r.case_id === s.case.id ? "page" : undefined}
              className="flex min-h-11 items-center justify-between gap-2 border-l-2 border-transparent px-3 py-2.5 hover:bg-surface-2 aria-[current=page]:border-brand aria-[current=page]:bg-brand-bg/60"
            >
              <span className="min-w-0">
                <span className="flex items-center gap-1.5 font-mono text-sm">
                  {r.case_id}
                  {r.critical && <span className="text-[10px] text-danger">crit</span>}
                </span>
                <span className="block truncate text-xs text-muted">{r.category}</span>
              </span>
              <span className="flex shrink-0 items-center gap-2 font-mono text-[11px] text-muted">
                <span aria-hidden className="flex gap-1">
                  <span className={`size-2 rounded-full ${r.base_pass ? "bg-success" : "bg-danger"}`} />
                  <span className={`size-2 rounded-full ${r.cand_pass ? "bg-success" : "bg-danger"}`} />
                </span>
                <span className={r.regression ? "text-danger" : ""}>
                  A {r.base_pass ? "pass" : "fail"} · {cand} {r.cand_pass ? "pass" : "fail"}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <p className="border-t border-line px-4 py-2 font-mono text-xs text-muted">
        {rows.length} of {v.rows.length} cases{reg ? " (regressions)" : ""}
      </p>
    </section>
  );
}
