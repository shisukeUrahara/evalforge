import { expect, test } from "vitest";
import { buildContext } from "./build";
import { contextRef, loadSlices } from "./slices";

const v1 = loadSlices(process.cwd(), "v1");
const v2 = loadSlices(process.cwd(), "v2");

test("18 Stripe slices and 12 Northstar rules", () => {
  expect([...v1.values()].filter((s) => s.source === "stripe")).toHaveLength(18);
  expect([...v1.values()].filter((s) => s.source === "northstar")).toHaveLength(12);
  expect(v1.get("ns:NS-R1")!.title).toMatch(/SYNTHETIC/);
});

test("same slices in any order give the same ref; changed text gives a new one", () => {
  const a = buildContext(["stripe:refunds.create", "ns:NS-R1"], v1);
  const b = buildContext(["ns:NS-R1", "stripe:refunds.create"], v1);
  expect(a.ref).toBe(b.ref);
  expect(a.ref).toMatch(/^ctx_[0-9a-f]{12}$/);
  expect(buildContext(["stripe:refunds.create", "ns:NS-R1"], v2).ref).not.toBe(a.ref); // NS-R1 changed in v2
  expect(buildContext(["stripe:refunds.create"], v2).ref).toBe(buildContext(["stripe:refunds.create"], v1).ref);
  expect(a.text).toContain("[ns:NS-R1]");
});

test("an unknown slice id throws", () => {
  expect(() => buildContext(["stripe:nope"], v1)).toThrow(/unknown slice id/);
  expect(contextRef([])).toMatch(/^ctx_/);
});
