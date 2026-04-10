import { test, expect } from "@playwright/test";

// Test microsite pages load correctly
// Uses a known published project slug
const SLUG = process.env.TEST_PROJECT_SLUG || "indigo-houses";

test.describe("Microsite Public Pages", () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test("homepage / hero should load", async ({ page }) => {
    await page.goto(`/sites/${SLUG}`);
    await page.waitForLoadState("domcontentloaded");

    // Should have the project name visible
    await expect(page.locator("body")).not.toBeEmpty();

    // Should have a CTA button
    await expect(
      page.getByRole("link", { name: /entrar|experiencia|enter/i }).or(
        page.getByRole("button", { name: /entrar|experiencia|enter/i })
      )
    ).toBeVisible({ timeout: 10000 });
  });

  test("galería should load images", async ({ page }) => {
    await page.goto(`/sites/${SLUG}/galeria`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // Should have at least one image
    const images = page.locator("img");
    await expect(images.first()).toBeVisible({ timeout: 10000 });
  });

  test("contacto should show lead form", async ({ page }) => {
    await page.goto(`/sites/${SLUG}/contacto`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // Should have form elements
    await expect(page.locator("form, [data-form]").first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("ubicación should load map", async ({ page }) => {
    await page.goto(`/sites/${SLUG}/ubicacion`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(4000);

    // Map canvas or container should be present
    await expect(
      page.locator("canvas, .mapboxgl-map, [class*=map]").first()
    ).toBeVisible({ timeout: 15000 });
  });

  test("tipologías should show floor plans", async ({ page }) => {
    await page.goto(`/sites/${SLUG}/tipologias`);
    await page.waitForLoadState("domcontentloaded");
    await page.waitForTimeout(2000);

    // Should have tab navigation or type selector
    await expect(page.locator("body")).not.toBeEmpty();

    // Should have at least one image (floor plan render)
    const images = page.locator("img");
    await expect(images.first()).toBeVisible({ timeout: 10000 });
  });
});
