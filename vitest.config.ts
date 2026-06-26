import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Shared unit-test harness (introduced by the remediation milestone).
// Server/logic + route-handler tests run in the Node environment; the Playwright
// e2e suite under tests/e2e is excluded so the two runners never collide.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["node_modules/**", ".next/**", "tests/e2e/**"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
