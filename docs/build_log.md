# Build log

Two-day build, 4–5 Nov 2026. Plan: 78 commits over 2 days, brainstormed with four rounds of EGM review agents.

## Day 1 (4 Nov)
- Stitch screens first; owner approved the dark set; light and phone versions followed.
- LangChain layer behind one gateway. The spike found that structured output throws on malformed JSON and drops refusal text, that `timeout` is milliseconds, and that `batch` takes `returnExceptions` as its third argument. The runner now taps the raw HTTP reply.
- Data: 18 Stripe OpenAPI slices (b213739, MIT), 12 SYNTHETIC Northstar rules (v1, v2). 80 cases drafted by gpt-4.1 ($0.069). The draft marked 74 critical and labelled clear "no" answers as refusals; two Claude reviewer agents fixed 68 (critical 74 → 33). Split frozen: 30 tuning / 50 holdout.
- First tuning run: strict A 27/30, friendlier B 20/30 on deterministic checks; B cited ids that do not exist. Judge v1: 0.07 vs 0.37 unsupported claims per answer; canaries 10/10.
- One red CI run: a test cast failed typecheck after a commit; fixed in the next commit. Lesson: never pipe vitest through grep inside an `&&` chain.

## Day 2 (5 Nov)
- Owner moved all labeling to the end, so judge v1 was frozen without a tuning round (labels only measure it).
- Gate rules committed before the holdout run. The holdout guard refused the null run while the first run's files were uncommitted, as designed.
- Holdout: A 44/50, B 36/50 → BLOCK (6 regressions, noise floor 0). Model swap to gpt-4o-mini: 45/50, cost −65% → SHIP, with a missing-citation footnote. Injected C never stated the false rule (pre-registered test not met); still BLOCK on regressions.
- Canaries 30/30. `ef reproduce`: 6 runs, 1,240 answers, byte-identical gates with no key, in CI.
- UI built to the approved screens by a builder agent; docs and content.
- Total model cost: $2.25.
- CI fail-to-pass demo: PR #1 edited gated prompt B in place; `ef reproduce` failed with CacheMissError; the revert passed. One slip on the way: a broken shell chain closed the PR with a comment claiming the revert had passed before it had; the PR was reopened, the revert run, and the claim confirmed with run ids.
- Fresh-clone check (5 Nov): `git clone` → `EF_PORT=3021 docker compose up --build` with no `.env`: `/` shows BLOCK for B and SHIP for `?c=M`, `/compare` and `/judge` render, `/runs/<id>/gate.json` downloads, unknown paths 404, and the clone stayed clean (`git status` empty).

## After the build
- Owner labels 20 tuning + 40 holdout answers; `ef trust`, `ef compare-gates`, re-gate, update analysis and content.
