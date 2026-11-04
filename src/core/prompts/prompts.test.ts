import { expect, test } from "vitest";
import { diffLines } from "./diff";
import { loadPrompt } from "./registry";

test("A and B load with system + user messages and mustache placeholders", () => {
  for (const name of ["A.v1", "B.v1"]) {
    const p = loadPrompt(process.cwd(), name);
    expect(p.messages.map((m) => m.role)).toEqual(["system", "user"]);
    expect(p.messages[0].content).toContain("{{context}}");
    expect(p.messages[1].content).toBe("{{question}}");
    expect(p.sha).toMatch(/^[0-9a-f]{64}$/);
  }
  expect(loadPrompt(process.cwd(), "A.v1").sha).not.toBe(loadPrompt(process.cwd(), "B.v1").sha);
});

test("bad prompt names are refused", () => {
  expect(() => loadPrompt(process.cwd(), "../x")).toThrow(/A.v1/);
});

test("diff marks added and removed lines and keeps common ones", () => {
  expect(diffLines("a\nb\nc", "a\nx\nc")).toEqual([
    { op: " ", text: "a" },
    { op: "-", text: "b" },
    { op: "+", text: "x" },
    { op: " ", text: "c" },
  ]);
  const ab = diffLines(loadPrompt(process.cwd(), "A.v1").text, loadPrompt(process.cwd(), "B.v1").text);
  expect(ab.some((l) => l.op === "-" && l.text.includes("Answer ONLY from the sources"))).toBe(true);
});
