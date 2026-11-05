import path from "node:path";
import { expect, test } from "@playwright/test";

// Captures the post images from a server that reads the REAL data folder (read-only: nothing is clicked that writes):
//   pnpm build && pnpm start &
//   E2E_SHOTS=1 E2E_BASE_URL=http://localhost:3020 pnpm exec playwright test e2e/screenshots.spec.ts --project desktop --project mobile
// Images land in E2E_MEDIA_DIR (default ../content/evalforge/media, outside the repo).
test.skip(!process.env.E2E_SHOTS, "set E2E_SHOTS=1 to capture images");

const out = (name: string) => path.resolve(process.env.E2E_MEDIA_DIR ?? "../content/evalforge/media", name);
const B = "20261105T043553Z-holdout-B";

test("desktop images", async ({ page, isMobile }) => {
  test.skip(isMobile, "desktop only");
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("BLOCK");
  await page.screenshot({ path: out("ui-gate-dark.png") });
  await page.emulateMedia({ colorScheme: "light", reducedMotion: "reduce" });
  await page.screenshot({ path: out("ui-gate-light.png") });
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto(`/compare?run=${B}&case=c042`);
  await page.screenshot({ path: out("ui-compare-dark.png") });
  await page.goto("/judge");
  await page.screenshot({ path: out("ui-judge-dark.png") });
});

test("phone image", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile only");
  await page.emulateMedia({ colorScheme: "dark", reducedMotion: "reduce" });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("BLOCK");
  await page.screenshot({ path: out("ui-gate-phone.png") });
});
