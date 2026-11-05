# ADR 0004: One LangChain.js model layer (copy-me guide)

**Status:** accepted (4 Nov 2026). The owner will reuse this folder in future projects.

## Decision
All model calls go through `src/core/llm/` and nothing else imports LangChain (ESLint rule, tested in `src/core/boundary.test.ts`).
- `config/models.json`: roles (`answer`, `swap`, `judge`, `drafter`) as `{ spec: "provider:model", method, params }`. Changing a model = editing a spec (plus a `pricing.json` row; `makeModel` refuses an unpriced model).
- `models.ts`: `initChatModel(spec, { temperature, maxTokens, maxRetries: 0 })`, built lazily on a cache miss, so replay needs no key.
- `runner.ts`: mustache prompt templates; strict `json_schema` response format from the zod schema; a fetch tap keeps the raw reply, finish reason and refusal, because LangChain throws on malformed JSON and drops refusal text (`docs/langchain_notes.md`).
- `errors.ts`: map errors by `status` / `name` / cause code, not by class, so other providers map the same way.
- `retry.ts`: our retries (429/5xx/timeout/network, 1 s then 4 s), a fresh millisecond timeout per attempt; latency is the last attempt.
- `gateway.ts`: cache → budget reservation → call → append to `cache/responses/<spec>.jsonl`. Key = spec, method, params, rendered messages, schema, arm, repeat.
- `batch.ts`: `RunnableLambda(gateway).batch(…, { maxConcurrency: 4 }, { returnExceptions: true })`.

## Switching provider (not demoed: no Anthropic key)
`pnpm add @langchain/anthropic`, set `ANTHROPIC_API_KEY`, add a `pricing.json` row, change the role's `spec` to `anthropic:<model>`. The fetch tap reads OpenAI-shaped bodies; for another provider the runner falls back to the LangChain message, so re-run the spike tests first.

## To reuse in a new project
Copy `src/core/llm/`, `src/core/cost/pricing.ts`, `src/core/runner/budget.ts`, `src/core/prompts/canonical.ts`, the lint rule and `spike.test.ts`; run the spike against the new versions before trusting anything.
