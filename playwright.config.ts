import { defineConfig } from "@playwright/test";

const config = defineConfig({
  testDir: "./tests/e2e",
  // E2E specs share a local embedded database, so parallel workers race each other.
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: true,
  },
});

export default config;
