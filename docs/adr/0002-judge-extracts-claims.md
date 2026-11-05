# ADR 0002: The judge extracts claims; deterministic checks run first

**Status:** accepted (4 Nov 2026)

## Context
If the model under test listed its own claims, a "friendly" answer could keep a made-up rule in its prose and leave it off the list. And a schema-broken answer must never be graded as semantically fine.

## Decision
- The answer schema is `{ answer, cited_source_ids, refused, refusal_reason }`; no self-reported claims.
- Order: schema (zod over the raw text) → deterministic checks (refusal decision, citations inside the context, required citations, rule values, forbidden phrases) → judge (claims with kind, material, attributed_to, verdict, evidence id) → human labels override per claim.
- A malformed answer is scored `schema_invalid` / `schema_truncated` / `model_refusal` and never reaches the judge.
- A judge parse failure is `judge_error`, never "unsupported"; ≥ 2 judge-dropped cases block (`judge_incomplete`).

## Rejected
- Model self-reported claims (gameable).
- Judge on everything (costly, and lets a broken answer look fine).

## Consequences
One extra gpt-4.1 call per answer (~$0.0023). The judge is the same family as the bot; its trust is measured against human labels (ADR 0003) and disclosed.
