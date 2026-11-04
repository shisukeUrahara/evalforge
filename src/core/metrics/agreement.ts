/** Share of items where both raters gave the same label. (From PromptFlight.) */
export function agreement(a: readonly string[], b: readonly string[]): number {
  check(a, b);
  return a.filter((x, i) => x === b[i]).length / a.length;
}

/**
 * Cohen's kappa: agreement beyond what two raters would reach by chance, given
 * how often each uses each label. 1 is perfect, 0 is chance. When chance
 * agreement is 1 (both raters always use one label) kappa is undefined:
 * this returns null instead of PromptFlight's 1, so it can never pass a bar.
 */
export function cohenKappa(a: readonly string[], b: readonly string[]): number | null {
  check(a, b);
  const n = a.length;
  const po = agreement(a, b);
  const count = (xs: readonly string[]) => xs.reduce((m, x) => m.set(x, (m.get(x) ?? 0) + 1), new Map<string, number>());
  const ca = count(a);
  const cb = count(b);
  let pe = 0;
  for (const [label, na] of ca) pe += (na / n) * ((cb.get(label) ?? 0) / n);
  return pe === 1 ? null : (po - pe) / (1 - pe);
}

/** Rows = first rater, columns = second rater, counts. */
export function confusion(a: readonly string[], b: readonly string[], labels: readonly string[]): number[][] {
  check(a, b);
  const m = labels.map(() => labels.map(() => 0));
  a.forEach((x, i) => {
    const r = labels.indexOf(x);
    const c = labels.indexOf(b[i]);
    if (r < 0 || c < 0) throw new Error(`label not in [${labels.join(", ")}]: ${r < 0 ? x : b[i]}`);
    m[r][c]++;
  });
  return m;
}

function check(a: readonly string[], b: readonly string[]): void {
  if (a.length !== b.length) throw new Error(`rater lists differ in length: ${a.length} vs ${b.length}`);
  if (a.length === 0) throw new Error("no items to compare");
}
