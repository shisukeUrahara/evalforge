import { expect, test } from "@playwright/test";

// Records the demo video (storyboard in design/stitch/README.md) from a server that reads the REAL data folder.
// Read-only: maya tries to waive and is refused, so nothing is written.
//   pnpm build && pnpm start &
//   E2E_DEMO=1 E2E_BASE_URL=http://localhost:3020 pnpm exec playwright test e2e/demo.spec.ts --project desktop
// The video lands in test-results/.
test.skip(!process.env.E2E_DEMO, "set E2E_DEMO=1 to record the demo video");
test.use({ viewport: { width: 1440, height: 900 }, video: { mode: "on", size: { width: 1440, height: 900 } } });

test("demo: gate, a blocked case, provenance, C and M, the judge audit", async ({ page }) => {
  test.setTimeout(180_000);
  const scroll = async (px: number) => {
    for (let i = 0; i < 12; i++) {
      await page.mouse.wheel(0, px / 12);
      await page.waitForTimeout(60);
    }
    await page.waitForTimeout(900);
  };
  await page.emulateMedia({ colorScheme: "dark" });
  // 0:00 release gate + version strip
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("BLOCK");
  await page.waitForTimeout(4000);
  // 0:12 blocked check -> case
  await scroll(450);
  await page.waitForTimeout(1500);
  await page.getByRole("link", { name: "c042" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("chargeback");
  await page.waitForTimeout(4000);
  // 0:30 provenance: slice text, manifest, prompt diff
  await page.locator("[aria-label='Provenance']").hover();
  await scroll(500);
  await scroll(500);
  await page.waitForTimeout(1500);
  await scroll(-1000);
  await page.getByRole("link", { name: "Regressions only" }).click();
  await page.waitForTimeout(2500);
  // 0:48 C (injected) and M (model swap)
  await page.goto("/?c=C");
  await page.waitForTimeout(3000);
  await page.goto("/compare?run=20261105T044636Z-holdout-C");
  await page.waitForTimeout(3500);
  await page.goto("/?c=M");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("SHIP");
  await page.waitForTimeout(3500);
  // maya may look but not waive
  await page.goto("/?c=B");
  await page.getByText("Waive this check…").click();
  await page.getByRole("textbox", { name: /Reason/ }).pressSequentially("tone change accepted", { delay: 25 });
  await page.getByRole("button", { name: "Record waiver and re-run gate" }).click();
  await expect(page.getByText("Not allowed (403)")).toBeVisible();
  await page.waitForTimeout(2500);
  // 1:05 judge audit: canaries, N, ranges, waiting for labels
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Judge audit" }).click();
  await page.waitForTimeout(3500);
  await scroll(600);
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  await page.waitForTimeout(2500);
});
