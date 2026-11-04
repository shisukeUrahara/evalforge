# EvalForge

A release gate for LLM changes. EvalForge runs a baseline and a candidate (a new prompt or a different model) on the same frozen support cases, uses an LLM judge to check every claim in every answer, measures that judge against human labels, and decides **ship** or **block** with the exact cases and reason codes behind it.

Status: under construction. Built in TypeScript with Next.js and LangChain.js.

Independent portfolio project, not affiliated with Stripe, OpenAI or LangChain. See [NOTICE.md](NOTICE.md).
