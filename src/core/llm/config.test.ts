import { expect, test } from "vitest";
import { ModelRole, loadModelRoles, splitSpec } from "./config";

test("the committed config has all four roles, all dated OpenAI snapshots", () => {
  const roles = loadModelRoles(process.cwd());
  expect(Object.keys(roles).sort()).toEqual(["answer", "drafter", "judge", "swap"]);
  for (const r of Object.values(roles)) expect(r.spec).toMatch(/^openai:gpt-[\w.-]+-\d{4}-\d{2}-\d{2}$/);
  expect(roles.answer.params.temperature).toBe(0);
  expect(roles.answer.spec).not.toBe(roles.swap.spec);
});

test("spec must name a provider", () => {
  const base = { method: "jsonSchema", params: { temperature: 0, maxTokens: 10 } };
  expect(ModelRole.safeParse({ ...base, spec: "gpt-4.1" }).success).toBe(false);
  expect(ModelRole.safeParse({ ...base, spec: "anthropic:claude-haiku" }).success).toBe(true);
});

test("splitSpec keeps colons after the first one in the model", () => {
  expect(splitSpec("openai:gpt-4.1-mini-2025-04-14")).toEqual({ provider: "openai", model: "gpt-4.1-mini-2025-04-14" });
  expect(splitSpec("ollama:llama3:8b")).toEqual({ provider: "ollama", model: "llama3:8b" });
});
