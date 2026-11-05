import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const PAGES = ["/", "/?c=M", "/?c=C", "/compare", "/compare?only=reg", "/judge"];
const STATES = [...PAGES, "/compare?run=20990101T000000Z-holdout-X", "/no-such-page"];

async function cannotScrollSideways(page: Page) {
  const [content, screen] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(content).toBeLessThanOrEqual(screen);
}

for (const path of STATES) {
  test(`${path} renders without sideways scroll`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await cannotScrollSideways(page);
  });
}

for (const theme of ["light", "dark"] as const) {
  for (const path of PAGES) {
    test(`${path} has no axe violations (${theme})`, async ({ page }) => {
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(", ")}`)).toEqual([]);
    });
  }
}

test("theme choice survives a reload", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "light" });
  await page.goto("/judge");
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await page.getByRole("button", { name: "Toggle dark mode" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
});

test("an unknown address is a 404; an unknown run id shows the same page", async ({ page }) => {
  expect((await page.goto("/no-such-page"))?.status()).toBe(404);
  // The page streams behind loading.tsx, so the status is already sent; the not-found page still replaces it.
  await page.goto("/compare?run=20990101T000000Z-holdout-X");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("No such page, run or case");
  await page.getByRole("navigation", { name: "Pages" }).getByRole("link", { name: "Judge audit" }).click();
  await expect(page).toHaveURL(/\/judge$/);
});
