import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { AnswerColumn, CaseList, Provenance, QuestionCard } from "@/components/compare/Compare";
import { Drawer } from "@/components/Drawer";
import { Empty } from "@/components/StateViews";
import { VersionStrip } from "@/components/VersionStrip";
import { gatedCandidates } from "@/core/views/common";
import { comparisonView } from "@/core/views/comparison";
import { dataDir, one } from "../_lib/data";
import { runManifest } from "../_lib/runs";

export const metadata: Metadata = { title: "Comparison" };
export const runtime = "nodejs";

export default async function ComparePage({ searchParams }: PageProps<"/compare">) {
  await connection();
  const sp = await searchParams;
  const dir = dataDir();
  const runId = one(sp.run) ?? gatedCandidates(dir)[0]?.run_id;
  if (!runId) {
    return (
      <div className="space-y-6">
        <h1 className="display text-4xl">Comparison</h1>
        <Empty title="No runs yet. Run a candidate against the baseline first." command="pnpm ef run --split holdout --candidate prompt:B.v1" />
      </div>
    );
  }
  const m = runManifest(dir, runId);
  const caseId = one(sp.case);
  if (!m || m.arms.length < 2 || (caseId && !(caseId in m.context_refs))) notFound();
  const v = comparisonView(dir, runId, caseId);
  const s = v.selected!;
  return (
    <div>
      <VersionStrip v={v.version} />
      <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)_20rem] xl:grid-cols-[17rem_minmax(0,1fr)_22rem]">
        <div className="min-w-0">
          <Drawer label={`Cases (${v.rows.length})`}>
            <section aria-label="Cases" className="overflow-hidden rounded-[20px] border border-line bg-surface/85 shadow-card">
              <h2 className="px-4 pb-2 pt-4 font-display text-base font-medium">Cases</h2>
              <CaseList v={v} />
            </section>
          </Drawer>
        </div>
        <div className="min-w-0 space-y-4">
          <QuestionCard s={s} />
          <div className="grid gap-4 md:grid-cols-2">
            <AnswerColumn a={s.baseline} unsupported={s.unsupported.baseline} />
            <AnswerColumn a={s.candidate} unsupported={s.unsupported.candidate} />
          </div>
        </div>
        <div className="min-w-0">
          <Drawer label="Provenance">
            <Provenance v={v} />
          </Drawer>
        </div>
      </div>
    </div>
  );
}
