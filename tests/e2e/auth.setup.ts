import { test as setup, expect } from "@playwright/test";
import path from "path";

const authFile = path.join(__dirname, ".auth/user.json");

setup("authenticate", async ({ page }) => {
  // Use environment variables for test credentials
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    // If no credentials provided, create an empty auth state
    // Tests that don't require auth will still work
    await page.goto("/");
    await page.context().storageState({ path: authFile });
    return;
  }

  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  // Fill login form
  await page.getByPlaceholder(/correo|email/i).fill(email);
  await page.getByPlaceholder(/contraseña|password/i).fill(password);

  // Submit
  await page.getByRole("button", { name: /iniciar|sign in|login/i }).click();

  // Wait for redirect to dashboard
  await expect(page).toHaveURL(/dashboard|proyectos/, { timeout: 15000 });

  // Save authenticated state
  await page.context().storageState({ path: authFile });
});
