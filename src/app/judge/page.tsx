import type { Metadata } from "next";
import { connection } from "next/server";
import { TrustRow } from "@/components/gate/Gate";
import { Canaries, ConfusionMatrix, Disagreements } from "@/components/judge/Judge";
import { Notice } from "@/components/StateViews";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { VersionStrip } from "@/components/VersionStrip";
import { judgeView } from "@/core/views/judge";
import { dataDir } from "../_lib/data";

export const metadata: Metadata = { title: "Judge audit" };
export const runtime = "nodejs";

export default async function JudgePage() {
  await connection();
  const v = judgeView(dataDir());
  const t = v.trust;
  return (
    <div>
      {v.version && <VersionStrip v={v.version} />}
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="display text-4xl md:text-5xl">Judge audit</h1>
          <p className="mt-2 text-muted">
            How far the frozen judge <span className="font-mono text-ink">{t.judge}</span> can be trusted on the {t.set} set. Every rate shows N and a 95% Wilson range.
          </p>
        </div>
      </header>
      {v.labels_pending && (
        <div className="mb-6">
          <Notice>Waiting for human labels: 0 answers labeled so far. Canary lines are measured now; the other lines show no number until the owner labels the holdout sheet.</Notice>
        </div>
      )}
      <div className="grid gap-6 lg:grid-cols-12">
        <div className="min-w-0 space-y-6 lg:col-span-7">
          <Card title="Trust bar" hint="The gate trusts the judge alone only if every line passes. Otherwise judge-only critical blocks wait for a human confirm." action={<Pill tone={t.trusted ? "success" : "warn"}>{t.trusted ? "trusted" : "not trusted"}</Pill>}>
            <ul className="divide-y divide-line">
              {t.lines.map((l) => (
                <TrustRow key={l.name} line={l} />
              ))}
            </ul>
            <p className="mt-2 font-mono text-xs text-muted">
              {t.answers_labeled} answers · {t.claims_labeled} claims labeled · labels log at line {t.labels_head.lines}
            </p>
          </Card>
          <Card title="Judge vs human">
            <ConfusionMatrix confusion={t.confusion} claims={t.claims_labeled} />
          </Card>
          <Card title="Changelog">
            <ul className="space-y-2 text-sm text-muted">
              {v.changelog.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="min-w-0 space-y-6 lg:col-span-5">
          <Card title="Canaries" hint="Answers with a planted unsupported claim. The judge must flag each one.">
            <Canaries sets={v.canaries} />
          </Card>
          <Card title="Disagreements">
            <Disagreements items={t.disagreements} />
          </Card>
        </div>
      </div>
    </div>
  );
}
