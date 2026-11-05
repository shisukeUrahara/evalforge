import { expect, test } from "@playwright/test";

const B = "20261105T043553Z-holdout-B";

test("gate: a failing case chip opens that case in Comparison", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("BLOCK");
  await page.getByRole("link", { name: "c042" }).click();
  await expect(page).toHaveURL(new RegExp(`/compare\\?run=${B}&case=c042$`));
  await expect(page.getByRole("heading", { level: 1 })).toContainText("chargeback");
});

test("gate.json downloads as the committed file", async ({ request }) => {
  const res = await request.get(`/runs/${B}/gate.json`);
  expect(res.status()).toBe(200);
  expect(res.headers()["content-disposition"]).toContain("attachment");
  expect((await res.json()).decision).toBe("block");
});

test("candidate switch: M ships", async ({ page }) => {
  await page.goto("/?c=M");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("SHIP");
});

test("comparison: regressions only, and the provenance sheet on small screens", async ({ page }) => {
  await page.goto(`/compare?run=${B}&only=reg`);
  const isMobile = page.viewportSize()!.width < 1024;
  if (isMobile) await page.getByRole("button", { name: /^Cases/ }).click();
  await expect(page.getByText("8 of 50 cases (regressions)")).toBeVisible();
  if (isMobile) await page.getByRole("button", { name: "Close" }).click();
  if (isMobile) await page.getByRole("button", { name: "Provenance" }).click();
  await expect(page.getByRole("heading", { name: "Run manifest" })).toBeVisible();
});

test("maya cannot waive: the server answers 403 and nothing changes", async ({ page }) => {
  await page.goto("/?c=B");
  await page.getByText("Waive this check…").click();
  await page.getByRole("textbox", { name: /Reason/ }).fill("injected test, accepted for the demo");
  await page.getByRole("button", { name: "Record waiver and re-run gate" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Not allowed (403)" })).toContainText("maya may not waive");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("BLOCK");
});

test("lee waives the regression check on C and the gate re-runs", async ({ page, context }, info) => {
  test.skip(info.project.name !== "desktop", "writes a waiver into e2e/.data once");
  await context.addCookies([{ name: "ef_user", value: "lee", url: process.env.E2E_BASE_URL ?? "http://localhost:3020" }]);
  await page.goto("/?c=C");
  await page.getByText("Waive this check…").click();
  await page.getByRole("textbox", { name: /Reason/ }).fill("injected test, accepted for the demo");
  await page.getByRole("button", { name: "Record waiver and re-run gate" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("SHIP");
  await expect(page.getByText("failed + waived")).toBeVisible();
});
