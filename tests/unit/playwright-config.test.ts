import { afterEach, expect, test, vi } from "vitest";

const mkdtempSync = vi.fn(() => "/tmp/ashfall-playwright-test");

vi.mock("node:fs", async (importOriginal) => {
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs");

  return {
    ...actual,
    default: {
      ...actual,
      mkdtempSync,
    },
    mkdtempSync,
  };
});

afterEach(() => {
  delete process.env.PLAYWRIGHT_BASE_URL;
  delete process.env.PGLITE_DATA_DIR;
  vi.clearAllMocks();
  vi.resetModules();
});

test("keeps the local dev server by default", async () => {
  const { default: config } = await import("../../playwright.config");

  expect(config.use?.baseURL).toBe("http://127.0.0.1:3100");
  expect(config.webServer).toMatchObject({
    command: "pnpm dev",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    env: expect.objectContaining({
      NEXTAUTH_URL: "http://127.0.0.1:3100",
      PORT: "3100",
      PGLITE_DATA_DIR: expect.stringMatching(/ashfall-playwright-/),
    }),
  });
  expect(mkdtempSync).toHaveBeenCalledOnce();
});

test("disables the local web server for hosted verification without creating a temp db", async () => {
  process.env.PLAYWRIGHT_BASE_URL = "https://mm-ac.vercel.app";
  vi.resetModules();

  const { default: config } = await import("../../playwright.config");

  expect(config.use?.baseURL).toBe("https://mm-ac.vercel.app");
  expect(config.webServer).toBeUndefined();
  expect(mkdtempSync).not.toHaveBeenCalled();
});
