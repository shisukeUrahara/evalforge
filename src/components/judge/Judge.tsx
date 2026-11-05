import { Pill } from "@/components/ui/Pill";
import type { TrustFile } from "@/core/metrics/trustRun";
import type { CanarySet } from "@/core/views/judge";

const V = ["supported", "unsupported", "uncertain"] as const;
const f2 = (x: number) => x.toFixed(2);

/** Human labels (rows) against the judge (columns). Claims the judge missed are not in it. */
export function ConfusionMatrix({ confusion, claims }: { confusion: number[][]; claims: number }) {
  if (claims === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line p-4 text-sm text-muted">
        Waiting for human labels. The matrix fills in after the holdout sheet is labeled and applied: <code className="font-mono text-ink">pnpm ef apply-labels --sheet data/labels/sheets/holdout.md</code>
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[420px] text-sm">
        <caption className="sr-only">Claims by human label (rows) and judge verdict (columns)</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="py-2 pr-3 text-left font-mono text-xs font-normal text-muted">
              human \ judge
            </th>
            {V.map((j) => (
              <th key={j} scope="col" className="px-3 py-2 text-right font-normal text-muted">
                {j}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {V.map((h, r) => (
            <tr key={h} className="border-b border-line last:border-0">
              <th scope="row" className="py-2.5 pr-3 text-left font-normal">
                {h}
              </th>
              {V.map((j, c) => (
                <td key={j} className={`num px-3 py-2.5 text-right font-mono ${r === c ? "font-medium text-brand" : ""}`}>
                  {confusion[r][c]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Disagreements({ items }: { items: TrustFile["disagreements"] }) {
  if (items.length === 0) return <p className="text-sm text-muted">None yet: disagreements appear once human labels exist.</p>;
  return (
    <ul className="divide-y divide-line">
      {items.map((d, i) => (
        <li key={i} className="py-3">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm">{d.text}</p>
            <Pill>
              {d.case_id} · {d.arm}
            </Pill>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Pill tone={d.human === "supported" ? "success" : d.human === "unsupported" ? "danger" : "warn"}>human: {d.human}</Pill>
            <Pill tone={d.judge === null ? "neutral" : d.judge === "supported" ? "success" : d.judge === "unsupported" ? "danger" : "warn"}>judge: {d.judge ?? "missed"}</Pill>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function Canaries({ sets }: { sets: CanarySet[] }) {
  if (sets.length === 0) return <p className="text-sm text-muted">No canary results yet. Run <code className="font-mono text-ink">pnpm ef canaries --run &lt;run id&gt;</code>.</p>;
  return (
    <div className="space-y-4">
      {sets.map((s) => (
        <div key={s.set}>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
              <p className="display text-4xl text-success">{s.caught}</p>
              <p className="micro mt-2">caught · {s.set}</p>
            </div>
            <div className="rounded-2xl border border-line bg-surface-2/60 p-4">
              <p className={`display text-4xl ${s.missed.length ? "text-danger" : "text-ink"}`}>{s.missed.length}</p>
              <p className="micro mt-2">missed · {s.set}</p>
            </div>
          </div>
          <p className="mt-2 font-mono text-xs text-muted">
            {s.caught}/{s.total} caught · 95% range {f2(s.range.low)}–{f2(s.range.high)}
          </p>
          {s.missed.map((m) => (
            <p key={m.canary_id} className="mt-2 rounded-xl bg-surface-2 p-3 font-mono text-xs">
              {m.canary_id}: {m.injected_value ?? "(no injected value)"}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}
