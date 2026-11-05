import type { VersionStrip as V } from "@/core/views/common";

/** Dataset, prompts, models, judge and run of what the page shows. Mono, steel ink, wraps on phone. */
export function VersionStrip({ v }: { v: V }) {
  const items: [string, string][] = [
    ["dataset", v.dataset],
    ["sha", v.dataset_sha],
    ...v.prompts.map((p): [string, string] => ["prompt", p]),
    ...v.models.map((m): [string, string] => ["model", m]),
    ["judge", v.judge],
    ["sha", v.judge_sha],
    ["run", v.run_id],
  ];
  return (
    <p aria-label="Versions" className="-mt-2 mb-6 flex flex-wrap gap-x-2 gap-y-1 border-b border-line/70 pb-3 font-mono text-xs text-muted md:-mt-4">
      {items.map(([k, val], i) => (
        <span key={i} className="whitespace-nowrap">
          {i > 0 && <span aria-hidden className="mr-2">·</span>}
          {k} <span className="text-ink">{val}</span>
        </span>
      ))}
    </p>
  );
}
