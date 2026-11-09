# Judge changelog

## claims.v1 — frozen 5 Nov 2026, before the holdout run
- File: `data/judge/claims.v1.md`; model role `judge` (`openai:gpt-4.1-2025-04-14`, temperature 0).
- Tuning evidence: 60 tuning answers judged with 0 judge errors; 10/10 tuning canaries caught (`data/canaries/tuning.claims.v1.results.jsonl`).
- **No tuning round.** The plan allowed one round (v2) tuned on 20 human-labeled tuning answers. The owner chose to do all labeling at the end of the build, so there were no human labels before the holdout run. Tuning the judge on canaries alone would fit it to our own injected sentences, so v1 is frozen as is.
- Consequence: the human labels (tuning and holdout) are used only to measure v1, never to change it. That keeps the holdout agreement numbers clean.
- Stop rule (pre-registered): no judge edits after the holdout run. A failed trust bar makes the judge advisory; it does not trigger a v2.

## claims.v1 — measured 9 Nov 2026 against owner labels
- 40 holdout answers, 119 claims (`data/labels/trust-claims.v1.json`): κ 0.55 (bar 0.6, **fail**); random-half recall 1/13 (not estimable, needs n ≥ 15); missed claims 0%; canaries 30/30; control false alarms 0/14. **Not trusted.**
- Failure mode: all 28 disagreements are owner-unsupported / judge-supported, mostly "Stripe does not do X" claims the sources never state.
- Per the stop rule, v1 is not edited. Candidate v2 rule for a future label set: a claim about what Stripe does not do is unsupported unless a slice says it.
