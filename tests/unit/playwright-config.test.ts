import { afterEach, expect, test, vi } from "vitest";

afterEach(() => {
  delete process.env.PLAYWRIGHT_BASE_URL;
  vi.resetModules();
});

test("keeps the local dev server by default", async () => {
  const { default: config } = await import("../../playwright.config");

  expect(config.use?.baseURL).toBe("http://127.0.0.1:3000");
  expect(config.webServer).toMatchObject({
    command: "pnpm dev",
    url: "http://127.0.0.1:3000",
  });
});

test("disables the local web server for hosted verification", async () => {
  process.env.PLAYWRIGHT_BASE_URL = "https://mm-ac.vercel.app";
  vi.resetModules();

  const { default: config } = await import("../../playwright.config");

  expect(config.use?.baseURL).toBe("https://mm-ac.vercel.app");
  expect(config.webServer).toBeUndefined();
});
