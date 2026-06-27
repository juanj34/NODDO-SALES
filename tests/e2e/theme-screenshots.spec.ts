import { test, expect, type Page } from "@playwright/test";

/**
 * Dual-theme visual verification: walks routes in BOTH light and dark and
 * captures a full-page screenshot of each. Run against a dev server:
 *   BASE_URL=http://localhost:3000 npx playwright test theme-screenshots
 *
 * PUBLIC routes run logged-out (no secrets needed). AUTHED routes are listed
 * below and run when a valid storageState exists (the repo's `setup` project)
 * plus a seeded test account + Supabase env. A representative microsite slug can
 * be set via TEST_SITE_SLUG (defaults to the mock project).
 */

const THEMES = ["light", "dark"] as const;

const PUBLIC_ROUTES = [
  "/",
  "/pricing",
  "/faq",
  "/nosotros",
  "/integraciones",
  "/roadmap",
  "/seguridad",
  "/recursos",
  "/casos-de-estudio",
  "/ayuda",
  "/legal/privacidad",
  "/legal/terminos",
  "/login",
  "/solicitar-demo",
];

const AUTHED_ROUTES = [
  // Dashboard
  "/dashboard", "/proyectos", "/leads", "/cotizaciones", "/cotizador",
  "/disponibilidad", "/financiero", "/equipo", "/cuenta", "/analytics", "/bitacora",
  // Platform-admin
  "/admin", "/admin/usuarios", "/admin/proyectos", "/admin/revenue", "/admin/leads",
  "/admin/facturacion", "/admin/health", "/admin/storage", "/admin/emails",
  "/admin/errores", "/admin/moderacion", "/admin/citas", "/admin/actividad", "/admin/admins",
];

async function shoot(page: Page, path: string, theme: string, baseURL?: string) {
  await page.context().addCookies([
    { name: "noddo-theme", value: theme, url: baseURL ?? "http://localhost:3000" },
  ]);
  await page.goto(path, { waitUntil: "networkidle" });
  // Confirm the attribute actually applied (catches FOUC / provider wiring regressions).
  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
  await expect(page).toHaveScreenshot(
    `${theme}${path === "/" ? "_home" : path.replace(/\//g, "_")}.png`,
    { fullPage: true, maxDiffPixelRatio: 0.02, animations: "disabled" }
  );
}

test.describe("theme — public (logged out)", () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  for (const theme of THEMES) {
    for (const path of PUBLIC_ROUTES) {
      test(`${theme} ${path}`, async ({ page, baseURL }) => {
        await shoot(page, path, theme, baseURL);
      });
    }
  }
});

// Authed surfaces — enable by running with the repo's `setup` storageState
// (npx playwright test) and a seeded account. Skipped by default so the public
// suite runs anywhere.
test.describe(process.env.RUN_AUTHED ? "theme — authed" : "theme — authed (skipped)", () => {
  test.skip(!process.env.RUN_AUTHED, "set RUN_AUTHED=1 with a valid storageState to run");
  for (const theme of THEMES) {
    for (const path of AUTHED_ROUTES) {
      test(`${theme} ${path}`, async ({ page, baseURL }) => {
        await shoot(page, path, theme, baseURL);
      });
    }
  }
});
