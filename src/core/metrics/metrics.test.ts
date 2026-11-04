import { expect, test } from "vitest";
import { agreement, cohenKappa, confusion } from "./agreement";
import { wilson } from "./wilson";

test("kappa: perfect, chance-level, and the all-same case is undefined (null), not 1", () => {
  expect(cohenKappa(["s", "u", "s", "u"], ["s", "u", "s", "u"])).toBe(1);
  expect(cohenKappa(["s", "s", "u", "u"], ["s", "u", "s", "u"])).toBeCloseTo(0, 10);
  expect(cohenKappa(["s", "s", "s"], ["s", "s", "s"])).toBeNull();
  expect(agreement(["s", "s", "s"], ["s", "s", "u"])).toBeCloseTo(2 / 3, 10);
});

test("confusion counts rows by first rater", () => {
  expect(confusion(["s", "u", "u"], ["s", "s", "u"], ["s", "u"])).toEqual([
    [1, 0],
    [1, 1],
  ]);
  expect(() => confusion(["x"], ["s"], ["s", "u"])).toThrow(/label not in/);
});

test("wilson matches known values", () => {
  const a = wilson(8, 10);
  expect(a.low).toBeCloseTo(0.4902, 3);
  expect(a.high).toBeCloseTo(0.9433, 3);
  expect(wilson(10, 10).low).toBeCloseTo(0.7225, 3);
  expect(wilson(0, 0)).toEqual({ low: 0, high: 1 });
});
