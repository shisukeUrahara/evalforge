# ADR 0003: Gate tiers, noise floor, confirms and waivers

**Status:** accepted (5 Nov 2026); rules in `gate/rules.v1.json`, committed before the holdout run.

## Decision
- **Critical** (block, never waivable): context/case mismatch, a critical case where the candidate has more unsupported material claims than the baseline, schema regression, judge incomplete.
- **Priority** (block, waivable): cases the baseline passes and the candidate fails in store_policy + negative, at ≥ max(2, null-run flips + 1). The null run is the baseline against itself with fresh calls (a distinct arm slot in the cache key), so a candidate must beat run-to-run noise.
- **Warn**: parity mismatches, p95 latency +25%, cost +25% (cost_down reported).
- **Judge trust**: if the trust bar (κ ≥ 0.6, random-half recall ≥ 0.8 with n ≥ 15, misses ≤ 10%, canary recall ≥ 0.9, control false alarms ≤ 0.2) is not met, a critical failure decided only by the judge becomes `pending_confirm` until a human confirms each case.
- **Waivers** bind to candidate prompt sha, model spec, dataset sha, rules sha, judge sha and the sorted failing case ids; any change voids them. A waived check stays visible as `failed_waived`.
- **Reproducibility**: `gate.json` has no clock fields and records the line count + sha of the labels, waivers and confirms logs it read; `ef reproduce` rebuilds it byte for byte.

## Rejected
- McNemar as the gate: almost no power at 50 cases; counts and a measured noise floor are honest and readable.
- Hash-chained logs: append-only JSONL in git already gives the audit trail.

## Consequences
Small N stays visible (counts, N, ranges). A gate decision can change only through a new commit to a log, never silently.
