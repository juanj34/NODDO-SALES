import { test, expect } from "@playwright/test";

test.describe("Editor Tab Navigation", () => {
  // These tests require authentication (uses storageState from setup)

  test.skip(
    !process.env.TEST_USER_EMAIL,
    "Requires TEST_USER_EMAIL and TEST_USER_PASSWORD env vars"
  );

  test("should navigate to projects list", async ({ page }) => {
    await page.goto("/proyectos");
    await page.waitForLoadState("networkidle");

    // Should show projects page (not redirected to login)
    await expect(page).not.toHaveURL(/login/);

    // Should have at least the page title
    await expect(page.getByText(/proyectos/i).first()).toBeVisible();
  });

  test("should open editor and navigate tabs", async ({ page }) => {
    await page.goto("/proyectos");
    await page.waitForLoadState("networkidle");

    // Find first edit link/button
    const editLink = page.locator("a[href*='/editor/']").first();

    if (!(await editLink.isVisible())) {
      test.skip(true, "No projects found to test editor");
      return;
    }

    await editLink.click();
    await page.waitForLoadState("networkidle");

    // Should be in editor
    await expect(page).toHaveURL(/editor/);

    // Check that sidebar tabs are visible
    const tabLabels = [
      /general/i,
      /tipolog/i,
      /inventario/i,
      /galer/i,
    ];

    for (const label of tabLabels) {
      await expect(
        page.getByText(label).first()
      ).toBeVisible({ timeout: 5000 });
    }
  });
});
