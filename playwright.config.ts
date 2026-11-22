import { defineConfig } from "@playwright/test";

import { testDatabaseUrl } from "./tests/setup/test-database";

const PORT = 3210;

/**
 * Tests de bout en bout. Le serveur est lancé sur la BASE DE TEST (jamais la base de travail).
 * Navigateur : Microsoft Edge installé sur le poste (canal « msedge »), aucun téléchargement de navigateur.
 * Build de production (CSP, en-têtes et cookies réels) servi par « next start », pour tester ce qui sera livré.
 */
export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    channel: process.env.PLAYWRIGHT_CHANNEL ?? "msedge",
    locale: "fr-FR",
    trace: "retain-on-failure",
  },
  webServer: {
    command: `npx next build && npx next start -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 300_000,
    env: { DATABASE_URL: testDatabaseUrl() },
  },
});
