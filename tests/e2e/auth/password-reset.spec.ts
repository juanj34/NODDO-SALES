import { test, expect } from "@playwright/test";

test.describe("Password Reset Flow", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("should navigate to password reset from login", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.locator('a[href="/recuperar"]').click();
    await expect(page).toHaveURL(/recuperar/);
  });

  test("should render password reset form", async ({ page }) => {
    await page.goto("/recuperar");
    await page.waitForLoadState("networkidle");

    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should submit email and show response", async ({ page }) => {
    await page.goto("/recuperar");
    await page.waitForLoadState("networkidle");

    await page.locator('input[type="email"]').fill("test@example.com");
    await page.locator('button[type="submit"]').click();

    // Should show either success or error message (depends on Supabase config)
    await expect(
      page.getByText(/enviado|error|disabled/i)
    ).toBeVisible({ timeout: 10000 });
  });
});
