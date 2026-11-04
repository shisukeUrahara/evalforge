import { expect, test } from "vitest";
import { main } from "./main";
import { testDeps } from "./testing/deps";

test("unknown command prints usage with exit 64; help exits 0", async () => {
  const a = testDeps();
  expect(await main(["nope"], a.deps)).toBe(64);
  expect(a.err[0]).toMatch(/usage: ef <doctor/);
  expect(await main(["help"], testDeps().deps)).toBe(0);
});

test("doctor reports the mode", async () => {
  const live = testDeps({ baseURL: "http://127.0.0.1:9/v1" });
  await main(["doctor"], live.deps);
  expect(live.out[0]).toBe("live mode, key found");
  const replay = testDeps();
  await main(["doctor"], replay.deps);
  expect(replay.out[0]).toMatch(/^replay mode/);
});
