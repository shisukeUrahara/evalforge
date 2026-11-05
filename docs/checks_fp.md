# Deterministic check false positives (tuning)

Measured on `runs/20261104T082431Z-tuning-B` (30 tuning cases, arms A and B, 60 answers) before freezing the checks.

| Check | Fired | Looked at by hand | False positives |
|---|---|---|---|
| `semantic_wrong_refusal` | A 3, B 10 | all 13 | 0: every one answered a `negative` or must-refuse case instead of refusing |
| `semantic_cites_outside_context` | B 2 | both | 0: cited ids that do not exist (`ns:refund-policy`, `ns:return_policy`) |
| `semantic_missing_citation` | 0 | — | — |
| `semantic_rule_mismatch` (regex on rule values) | 0 | the 7 tuning cases with `must_match_rule` all stated the value | 0 |
| `semantic_forbidden_phrase` (regex) | 0 | — | 0 |

Unit tests cover the cases the reviewers worried about: number words ("thirty days"), "30-day", money and percent forms, and negated mentions ("not 30 days"): `src/core/checks/expected.test.ts`.

Decision: no changes; the checks are frozen with the gate rules. Limitation: 60 answers is small; the regex checks did not fire at all on tuning, so their real false-positive rate on holdout is unknown until the holdout run (reported in `docs/analysis.md`).
