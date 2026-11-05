# Holdout analysis

> **Status: judge-only.** Every claim verdict below is the gpt-4.1 judge's (v1, frozen before the holdout). Human labels come at the end of the build; then `ef trust` measures the judge, the gates are re-run, and this file is updated. Until then the judge counts as not trusted, which the gate shows.

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
| A (baseline) | 44 / 50 | 0.00 | 5 / 5 | 6 / 6 | 0 / 6 pairs | 1429 ms | $0.000254 |
| B (friendlier) | 36 / 50 | 0.16 | 5 / 5 | 6 / 6 | 0 / 6 | 1640 ms | $0.000299 |
| A2 (null) | 45 / 50 | 0.00 | 5 / 5 | 6 / 6 | 0 / 6 | 1352 ms | — |
| M (gpt-4o-mini) | 45 / 50 | 0.01 | 4 / 5 | 6 / 6 | 0 / 6 | 1528 ms | $0.000090 |

Answer level, deterministic checks only: A 133/150 answers pass, B 108/150 (42 wrong refusal decisions vs 17, 3 citations of ids not in its context), M 135/150.

## Gate decisions (rules `gate/rules.v1.json`)
- **B: BLOCK.** 6 cases A passes and B fails in store_policy + negative (c042, c049, c053, c054, c055, c059); the noise floor is 0 (A vs A had no such flips), so the block threshold is max(2, 0 + 1) = 2. Two more regressions are in parity cases (c075, c076). No critical case got more unsupported claims, and no schema regressions.
- **M: SHIP.** 1 gated regression (c049), below the threshold of 2. Cost per answer −65%, p95 latency +7%.

## What the averages hide
- B's failures are mostly answering questions it should refuse: it states things the sources do not say ("Stripe refunds must be issued in the same currency as the original payment"; tuning case c051). Its prompt asks for "fewer dead-end refusals", and it complies.
- M ships, but it is not free: on critical case c003 ("I only have a PaymentIntent ID…") M answered correctly in all 3 repeats but never cited the source it relied on (`semantic_missing_citation`). The pre-registered rules block on unsupported claims, not on a missing citation, so this does not block. On c049 M said "the sources do not mention any deduction" (a correct refusal in words) without setting `refused`, so the case counts as a wrong refusal decision.
- Noise: A vs A2 differs in pass count (44 vs 45) but has no gated A-pass/A2-fail flips; the swap model against itself had 1 gated flip on 30 tuning cases. Both are temperature-0 numbers; real traffic will be noisier.

## Limits
- Judge-only verdicts until the human labels are in (see top).
- 50 holdout cases, 6 parity pairs: report counts, not only rates.
- Synthetic cases (LLM-drafted, model-reviewed); one provider family for both the answer and judge models.
- Strict structured output makes schema regressions close to impossible here.
- The swap noise floor was measured on tuning; the M gate uses the A vs A null run of the same holdout split (comparing a tuning run with a holdout run would be a case mismatch).
