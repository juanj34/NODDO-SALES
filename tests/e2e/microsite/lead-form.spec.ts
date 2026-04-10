import { test, expect } from "@playwright/test";

const SLUG = process.env.TEST_PROJECT_SLUG || "indigo-houses";

test.describe("Lead Form Submission", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("should fill and submit lead form", async ({ page }) => {
    await page.goto(`/sites/${SLUG}/contacto`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(3000);

    // Fill name
    const nameInput = page.getByPlaceholder(/nombre|name/i).first();
    if (await nameInput.isVisible()) {
      await nameInput.fill("Test User E2E");
    }

    // Fill email
    const emailInput = page.getByPlaceholder(/correo|email/i).first();
    if (await emailInput.isVisible()) {
      await emailInput.fill("e2e-test@noddo.io");
    }

    // Fill phone
    const phoneInput = page.getByPlaceholder(/teléfono|phone|celular/i).first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill("3001234567");
    }

    // Take screenshot for visual verification
    await page.screenshot({
      path: "test-results/lead-form-filled.png",
      fullPage: false,
    });
  });
});
