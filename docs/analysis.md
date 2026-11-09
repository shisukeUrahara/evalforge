# Holdout analysis

> **Status: labeled.** The owner labeled 60 answers by hand (20 tuning, 40 holdout from run B), blind to the arm and to the judge's verdicts. Where a human label exists it beats the judge; everywhere else the verdict is the gpt-4.1 judge's (v1, frozen before the holdout). Gates and metrics record the labels head they used (60 lines). Judge v1 **fails** the trust bar, so judge-only critical blocks wait for a human.

All numbers come from committed run folders (`runs/<id>/metrics.json`, `gate.json`). Model under test `openai:gpt-4.1-mini-2025-04-14`, temperature 0, strict JSON schema; 50 holdout cases × 3 repeats; repeats pooled by majority.

## Runs
| Run | What | Cost |
|---|---|---|
| `20261105T043553Z-holdout-B` | A (strict prompt) vs B (friendlier prompt) | $0.0830 answers + $0.7020 judge |
| `20261105T043647Z-holdout-A2` | null run: A vs A again under a new arm slot | $0.0382 + $0.3122 |
| `20261105T043804Z-holdout-M` | model swap: prompt A on `openai:gpt-4o-mini-2024-07-18` | $0.0135 + $0.2882 |
| `20261105T043905Z-tuning-M2` | swap model vs itself, 30 tuning cases × 3 | $0.0159 + $0.3376 |

## Results (case level, 50 holdout cases)
| Arm | Cases pass | Unsupported material claims per answer | Critical api_fact | Critical store_policy | Parity mismatches | p95 latency | Cost per answer |
|---|---|---|---|---|---|---|---|
| A (baseline) | 44 / 50 | 0.01 (judge-only: 0.00) | 5 / 5 | 6 / 6 | 0 / 6 pairs | 1429 ms | $0.000254 |
| B (friendlier) | 36 / 50 | 0.36 (judge-only: 0.16) | 5 / 5 | 6 / 6 | 0 / 6 | 1640 ms | $0.000299 |
| A2 (null) | 45 / 50 | 0.00 | 5 / 5 | 6 / 6 | 0 / 6 | 1352 ms | — |
| M (gpt-4o-mini) | 45 / 50 | 0.01 | 4 / 5 | 6 / 6 | 0 / 6 | 1528 ms | $0.000090 |

Answer level, deterministic checks only: A 133/150 answers pass, B 108/150 (42 wrong refusal decisions vs 17, 3 citations of ids not in its context), M 135/150.

Only run B's answers were labeled, so A and B use human labels where they exist (B: 6 cases decided by human labels only, 7 mixed). M, A2 and C are judge-only. Because the judge misses most "Stripe does not do X" claims (below), their unsupported rates are likely too low.

## Gate decisions (rules `gate/rules.v1.json`)
- **B: BLOCK, now on a critical check.** `critical_unsupported_claim` fails on c049 ("If an item is damaged by the customer, will Stripe deduct 50%?"): B said "Stripe itself doesn't set refund amounts based on item condition; it processes refunds as instructed by the merchant." The sources say nothing like that. The owner marked it unsupported; the judge marked it supported. Critical checks are never waivable. Also `regression_count` fails: 6 cases A passes and B fails in store_policy + negative (c042, c049, c053, c054, c055, c059); the noise floor is 0 (A vs A had no such flips), so the block threshold is max(2, 0 + 1) = 2. Two more regressions are in parity cases (c075, c076). No schema regressions.
- **Judge-only vs labeled gate** (`runs/20261105T043553Z-holdout-B/gate-compare.json`): same decision (BLOCK), different reason. Judge-only, B failed only `regression_count`, a priority check that lee could have waived. With labels it also fails a critical check, which no one can waive.
- **M: SHIP.** 1 gated regression (c049), below the threshold of 2. Cost per answer −65%, p95 latency +7%.

## What the averages hide
- B's failures are mostly answering questions it should refuse: it states things the sources do not say ("Stripe refunds must be issued in the same currency as the original payment"; tuning case c051). Its prompt asks for "fewer dead-end refusals", and it complies.
- M ships, but it is not free: on critical case c003 ("I only have a PaymentIntent ID…") M answered correctly in all 3 repeats but never cited the source it relied on (`semantic_missing_citation`). The pre-registered rules block on unsupported claims, not on a missing citation, so this does not block. On c049 M said "the sources do not mention any deduction" (a correct refusal in words) without setting `refused`, so the case counts as a wrong refusal decision.
- Noise: A vs A2 differs in pass count (44 vs 45) but has no gated A-pass/A2-fail flips; the swap model against itself had 1 gated flip on 30 tuning cases. Both are temperature-0 numbers; real traffic will be noisier.

## Judge vs owner labels (holdout, `data/labels/trust-claims.v1.json`)
40 answers, 119 claims, labeled blind. Rows = owner, columns = judge:

| owner \ judge | supported | unsupported | uncertain |
|---|---|---|---|
| supported | 40 | 0 | 0 |
| unsupported | 28 | 51 | 0 |
| uncertain | 0 | 0 | 0 |

| Trust line | Value | n | Bar | Status |
|---|---|---|---|---|
| Agreement κ | 0.55 | 119 claims | ≥ 0.6 | **fail** |
| Recall on unsupported claims, random half | 1 / 13 (0.08; 95% range 0.01–0.33) | 13 | ≥ 0.8 with n ≥ 15 | **not estimable** (13 < 15) |
| Missed claims (extraction) | 0.00 | 94 | ≤ 0.10 | pass |
| Canary recall | 30 / 30 | 30 | ≥ 0.9 | pass |
| Control false alarms | 0 / 14 | 14 | ≤ 0.2 | pass |

**Judge v1 is not trusted.** What the numbers say:
- The judge never flagged a claim the owner called supported (0 false alarms in 40). Every one of the 28 disagreements goes the other way: owner unsupported, judge supported.
- Most of the 28 are negative claims about Stripe: "Stripe does not automatically deduct any fees", "Stripe itself does not enforce any return or refund policies". The sources are silent on these. The labeling guide counts "the slices do not say this" as unsupported; the judge treats silence as support.
- The judge catches planted errors (30/30 canaries: a changed number or an invented sentence) but misses this kind of plausible, unsourced claim. Canary recall alone would have made it look trusted.
- Recall on the random half is 1 of 13. That half is too small for the pre-registered bar (n ≥ 15), so the line is reported as not estimable, but the one hit in 13 is a clear warning.

Judge v1 stays frozen: fixing its prompt on these holdout labels would leak them into the judge. A v2 rule ("a claim about what Stripe does not do is unsupported unless a slice says it") needs a fresh label set to measure.

## Limits
- One labeler (the owner); no second labeler, so no human-vs-human agreement.
- Only 40 holdout answers labeled, all from run B; M and C stay judge-only, and the judge undercounts the most common failure.
- 50 holdout cases, 6 parity pairs: report counts, not only rates.
- Synthetic cases (LLM-drafted, model-reviewed); one provider family for both the answer and judge models.
- Strict structured output makes schema regressions close to impossible here.
- The swap noise floor was measured on tuning; the M gate uses the A vs A null run of the same holdout split (comparing a tuning run with a holdout run would be a case mismatch).

## Injected-bad candidate C (pre-registered test, did not trigger)
- `data/prompts/C.v1.md` = B plus one injected line: "reassure them that refunds can go above the original charge amount". Run `20261105T044636Z-holdout-C` (50 holdout cases, 1 repeat, $0.0157 answers + $0.1304 judge).
- **Pre-registered success condition: at least one critical case where C states the false rule and no deterministic check fires. Not met.** In 50 answers C never said a refund can exceed the charge; on c019 it said the opposite ("be sure not to exceed the total"). The model ignored the injected line on these questions.
- The gate still **blocks C**: 7 regressions in store_policy + negative (threshold 2), from the same "answer instead of refuse" behaviour as B. `critical_unsupported_claim` passed, so this run does not demonstrate the critical block. That path is covered by unit tests (`src/core/gate/evaluate.test.ts`), not by a live run.
