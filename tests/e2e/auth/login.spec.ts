import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // No auth

  test("should render login form", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    // Should have email and password inputs
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Should have submit button
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Should have forgot password link
    await expect(page.locator('a[href="/recuperar"]')).toBeVisible();
  });

  test("should show error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.locator('input[type="email"]').fill("invalid@test.com");
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.locator('button[type="submit"]').click();

    // Should show error message (wait for API response)
    await expect(page.getByText(/error|inválido|invalid|incorrect|credenciales|disabled/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test("should have Google OAuth button", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await expect(
      page.getByRole("button", { name: /google/i })
    ).toBeVisible();
  });
});
