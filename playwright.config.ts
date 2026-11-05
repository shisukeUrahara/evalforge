import path from "node:path";
import { defineConfig } from "@playwright/test";

const PORT = 3020;

// Tests run against a production build that reads a fresh copy of the committed data in e2e/.data,
// so a waiver recorded by a test never touches the real data/ or runs/. No API key: nothing calls a model.
// Set E2E_BASE_URL to test a server that is already running.
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  use: { baseURL: process.env.E2E_BASE_URL ?? `http://localhost:${PORT}` },
  projects: [
    { name: "mobile", use: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true } },
    { name: "tablet", use: { viewport: { width: 768, height: 1024 } } },
    { name: "desktop", use: { viewport: { width: 1440, height: 900 } } },
  ],
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: `rm -rf e2e/.data && mkdir -p e2e/.data && cp -r config data fixtures gate runs pricing.json e2e/.data/ && pnpm build && pnpm start`,
        url: `http://localhost:${PORT}`,
        reuseExistingServer: !process.env.CI,
        timeout: 300_000,
        env: { EF_DATA_DIR: path.resolve("e2e/.data"), OPENAI_API_KEY: "" },
      },
});
