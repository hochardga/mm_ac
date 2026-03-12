import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { defineConfig } from "@playwright/test";

const localBaseURL = "http://127.0.0.1:3100";
const useHostedTarget = Boolean(process.env.PLAYWRIGHT_BASE_URL);
const localPgliteDataDir =
  process.env.PGLITE_DATA_DIR ??
  mkdtempSync(path.join(tmpdir(), "ashfall-playwright-"));
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? localBaseURL;

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
        env: {
          ...process.env,
          NEXTAUTH_URL: localBaseURL,
          PGLITE_DATA_DIR: localPgliteDataDir,
          PORT: "3100",
        },
        url: localBaseURL,
        reuseExistingServer: false,
      },
});

export default config;
