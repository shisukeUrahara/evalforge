# Code tour

Read in this order. `src/core/` is framework-free logic (lint-enforced); `src/cli/` and `src/app/` only wire it up.

1. **Data and sources** — `src/core/domain/schemas.ts` (every record shape), `src/core/context/` (Stripe slices + Northstar rules, frozen context refs, `verify`), `src/core/dataset/` (registry, lint with leakage check, split, draft, review, frozen manifest).
2. **Model layer** — `src/core/llm/` (ADR 0004): `config.ts` → `models.ts` → `runner.ts` (raw tap) → `errors.ts`/`retry.ts` → `gateway.ts` (cache + budget) → `batch.ts`. `spike.test.ts` pins how LangChain really behaves; `testing/mockServer.ts` is the local fake OpenAI used by tests.
3. **A run** — `src/core/run/`: `arms.ts` (baseline + candidate: prompt, model swap, null), `paired.ts` (every arm, every case, R repeats, scored), `output.ts` (schema codes), `mismatch.ts`, `reproduce.ts`. `src/core/checks/` holds the deterministic checks.
4. **Judging** — `src/core/judge/` (claim judge, runner), `src/core/canary/` (broken-on-purpose answers), `src/core/labels/sheet.ts` (blind sheets), `src/core/score/` (human-over-judge merge, case pass rule).
5. **Numbers** — `src/core/metrics/`: `eval.ts` (pooling, per-arm metrics, regressions), `report.ts` (metrics.json), `trust.ts` + `trustRun.ts` (judge trust bar), `agreement.ts`, `wilson.ts`.
6. **Decision** — `src/core/gate/`: `evaluate.ts` (rules → checks → decision), `run.ts` (gate.json with log heads), `logs.ts` (waivers, confirms), `compare.ts` (judge-only vs human).
7. **Interfaces** — `src/cli/main.ts` lists every `ef` command; `src/core/views/` turns run folders into page data; `src/app/` renders the three pages.

Artifacts: `runs/<id>/` (manifest, outputs, judgments, metrics, gate, checksums), `cache/responses/` (every model reply), `data/` (cases, prompts, judge prompt, canaries, labels, waivers, confirms), `gate/rules.v1.json`.
