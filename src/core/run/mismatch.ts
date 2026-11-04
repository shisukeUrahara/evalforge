import type { RunManifest } from "../artifacts/manifest";

export interface Mismatch {
  code: "dataset_mismatch" | "case_mismatch" | "context_mismatch";
  detail: string;
  case_ids: string[];
}

/**
 * Two runs are comparable only on the same dataset, the same case ids and the
 * same frozen context per case. Any difference invalidates the comparison:
 * a regression could then come from the data, not the change under test.
 */
export function checkComparable(baseline: Pick<RunManifest, "dataset_sha" | "context_refs">, candidate: Pick<RunManifest, "dataset_sha" | "context_refs">): Mismatch[] {
  const out: Mismatch[] = [];
  if (baseline.dataset_sha !== candidate.dataset_sha) out.push({ code: "dataset_mismatch", detail: "runs used different datasets", case_ids: [] });
  const a = Object.keys(baseline.context_refs).sort();
  const b = Object.keys(candidate.context_refs).sort();
  const onlyOne = [...a.filter((id) => !b.includes(id)), ...b.filter((id) => !a.includes(id))].sort();
  if (onlyOne.length) out.push({ code: "case_mismatch", detail: `${onlyOne.length} case(s) in only one run`, case_ids: onlyOne });
  const changed = a.filter((id) => b.includes(id) && baseline.context_refs[id] !== candidate.context_refs[id]);
  if (changed.length) out.push({ code: "context_mismatch", detail: `${changed.length} case(s) saw different source text`, case_ids: changed });
  return out;
}
