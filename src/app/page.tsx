import { Crosshair, Download } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Empty } from "@/components/StateViews";
import { CandidateSwitch, caseHref, CheckRow, TrustRow, VerdictBanner } from "@/components/gate/Gate";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { VersionStrip } from "@/components/VersionStrip";
import { gateView } from "@/core/views/gate";
import { dataDir, one } from "./_lib/data";

export const metadata: Metadata = { title: "Release gate" };
export const runtime = "nodejs";

export default async function GatePage({ searchParams }: PageProps<"/">) {
  await connection();
  const sp = await searchParams;
  const v = gateView(dataDir(), one(sp.c));
  if (!v) {
    return (
      <div className="space-y-6">
        <h1 className="display text-4xl">Release gate</h1>
        <Empty title="No gated runs yet. Run a candidate against the baseline, then gate it." command="pnpm ef run --split holdout --candidate prompt:B.v1" />
      </div>
    );
  }
  const run = v.selected.run_id;
  const failing = v.tiers.flatMap((t) => t.checks).find((c) => c.status !== "pass" && c.status !== "warn" && c.case_ids.length > 0);
  return (
    <div>
      <VersionStrip v={v.version} />
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-8">
          <CandidateSwitch v={v} />
          <VerdictBanner v={v} />
          <Card title="Checks" action={<span className="font-mono text-xs text-muted">grouped by tier</span>}>
            <div className="space-y-6">
              {v.tiers.map((t) => (
                <section key={t.tier} aria-label={`${t.tier} tier`}>
                  <h3 className="micro mb-2">{t.tier} tier</h3>
                  <ul className="space-y-2">
                    {t.checks.map((c) => (
                      <CheckRow key={c.id} check={c} runId={run} />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </Card>
        </div>
        <aside className="min-w-0 space-y-6 lg:col-span-4">
          <Card title="Noise floor">
            {v.noise_floor === null ? (
              <p className="text-sm text-muted">Not measured: no A vs A null run was gated with this candidate.</p>
            ) : (
              <>
                <p className="font-mono text-sm">
                  A vs A regressions: <span className="num text-ink">{v.noise_floor}</span>
                </p>
                <p className="mt-2 text-sm text-muted">Gated categories only. A real change must beat this.</p>
              </>
            )}
          </Card>
          <Card title="Judge trust bar" action={<Pill tone={v.trust.trusted ? "success" : "warn"}>{v.trust.trusted ? "trusted" : "not trusted"}</Pill>}>
            <ul className="divide-y divide-line">
              {v.trust.lines.map((l) => (
                <TrustRow key={l.name} line={l} />
              ))}
            </ul>
            <p className="mt-2 font-mono text-xs text-muted">{v.trust.source}</p>
          </Card>
          <Card title="Waivers & confirms">
            <p className="text-sm text-muted">
              {v.waivers_used === 0 ? "No waivers" : `${v.waivers_used} waiver${v.waivers_used === 1 ? "" : "s"}`} · {v.confirms_used === 0 ? "no confirms" : `${v.confirms_used} confirm${v.confirms_used === 1 ? "" : "s"}`} in the logs this gate read.
            </p>
          </Card>
          <div className="space-y-3">
            <a href={`/runs/${run}/gate.json`} download className="flex min-h-11 items-center justify-center gap-2 rounded-[10px] bg-primary px-5 text-sm font-medium text-primary-ink">
              <Download aria-hidden className="size-4" />
              Download gate.json
            </a>
            {failing && (
              <Link href={caseHref(run, failing.case_ids[0])} className="flex min-h-11 items-center justify-center gap-2 rounded-[10px] border border-line px-5 text-sm font-medium hover:bg-surface-2">
                <Crosshair aria-hidden className="size-4" />
                Open failing case
              </Link>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
