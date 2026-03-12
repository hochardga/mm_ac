import { defineConfig } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000";
const useHostedTarget = Boolean(process.env.PLAYWRIGHT_BASE_URL);

const config = defineConfig({
  testDir: "./tests/e2e",
  // E2E specs share a local embedded database, so parallel workers race each other.
  workers: 1,
  use: {
    baseURL,
    trace: "retain-on-failure",
  },
  webServer: useHostedTarget
    ? undefined
    : {
        command: "pnpm dev",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: true,
      },
});

export default config;
