import { describe, expect, test } from "vitest";
import { loadEnv, requireLive } from "./env";

describe("loadEnv", () => {
  test("no key means replay mode", () => {
    expect(loadEnv({}, "/work")).toEqual({ mode: "replay", apiKey: null, dataDir: "/work" });
    expect(loadEnv({ OPENAI_API_KEY: "  " }).mode).toBe("replay");
  });
  test("a key means live mode", () => {
    expect(loadEnv({ OPENAI_API_KEY: "sk-x" })).toMatchObject({ mode: "live", apiKey: "sk-x" });
  });
  test("EF_DATA_DIR overrides the folder", () => {
    expect(loadEnv({ EF_DATA_DIR: "/data" }, "/work").dataDir).toBe("/data");
  });
});

describe("requireLive", () => {
  test("names the missing key and the replay escape hatch", () => {
    expect(() => requireLive(loadEnv({}))).toThrow(/OPENAI_API_KEY.*--replay/);
    expect(requireLive(loadEnv({ OPENAI_API_KEY: "sk-x" }))).toBe("sk-x");
  });
});
