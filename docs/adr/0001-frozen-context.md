# ADR 0001: Frozen context per case, no retrieval

**Status:** accepted (4 Nov 2026)

## Context
EvalForge compares a baseline with a candidate (a new prompt or a new model). If retrieval ran inside the comparison, a different ranking, index version or document edit could change the answer, and the gate would blame the prompt.

## Decision
Each case lists the slice ids it may use. The runner builds the context from those slices only and records `context_ref = ctx_ + sha256(sorted (id, text))[:12]` per case in the run manifest. Two runs are comparable only with the same dataset, case ids and context refs; otherwise the gate fails with `context_mismatch` / `case_mismatch` (critical, never waivable). The stale-context fixture (policy v1 vs v2) proves it without model calls.

## Rejected
- Reusing Atlas's retrieval: a second variable inside every comparison.
- Comparing on dataset hash only: misses an edited source slice.

## Consequences
Retrieval quality is out of scope (Atlas measures it). A source edit changes the refs and invalidates old comparisons visibly.
