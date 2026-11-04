import { expect, test } from "vitest";
import { loadPolicy, parsePolicy } from "./northstar";

const v1 = loadPolicy("fixtures/northstar/policy_v1.md");
const v2 = loadPolicy("fixtures/northstar/policy_v2.md");

test("v1 has 12 rules with ids, text and values", () => {
  expect(v1.map((r) => r.id)).toEqual(Array.from({ length: 12 }, (_, i) => `ns:NS-R${i + 1}`));
  expect(v1[0]).toMatchObject({ title: "Return window", values: ["30 days"] });
  expect(v1[1].values).toEqual([]);
  expect(v1[0].text).not.toContain("Values:");
});

test("v2 changes exactly NS-R1 and NS-R5", () => {
  const changed = v1.filter((r, i) => r.text !== v2[i].text).map((r) => r.id);
  expect(changed).toEqual(["ns:NS-R1", "ns:NS-R5"]);
  expect(v2[0].values).toEqual(["45 days"]);
  expect(v2[4].values).toEqual(["$5"]);
});

test("a policy without the SYNTHETIC notice is refused", () => {
  expect(() => parsePolicy("# x\n\n## NS-R1 A\ntext\nValues: none\n")).toThrow(/SYNTHETIC/);
});
