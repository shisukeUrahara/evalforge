import { expect, test } from "vitest";
import type { Deps } from "./deps";
import { main } from "./main";

function deps(replay = true) {
  const out: string[] = [];
  const err: string[] = [];
  const d: Deps = { dataDir: "/work", replay, now: () => new Date(0), out: (l) => out.push(l), err: (l) => err.push(l) };
  return { d, out, err };
}

test("unknown command prints usage with exit 64; help exits 0", async () => {
  const a = deps();
  expect(await main(["nope"], a.d)).toBe(64);
  expect(a.err[0]).toMatch(/usage: ef <doctor/);
  expect(await main(["help"], deps().d)).toBe(0);
});

test("doctor reports the mode", async () => {
  const live = deps(false);
  await main(["doctor"], live.d);
  expect(live.out[0]).toBe("live mode, key found");
  const replay = deps(true);
  await main(["doctor"], replay.d);
  expect(replay.out[0]).toMatch(/^replay mode/);
});
