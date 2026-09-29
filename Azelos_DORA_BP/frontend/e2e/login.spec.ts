import { test, expect } from "@playwright/test";

test.describe("DORA frontend (requires API on :8000)", () => {
  test.skip(!process.env.E2E_WITH_API, "Set E2E_WITH_API=1 when backend is running");

  test("login and view applicability", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Email").fill("admin@demo.bank");
    await page.getByLabel("Password").fill("ChangeMeNow!");
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 15_000 });
    await page.getByRole("link", { name: "Applicability" }).click();
    await expect(page.getByRole("heading", { name: "Applicability" })).toBeVisible();
  });
});
