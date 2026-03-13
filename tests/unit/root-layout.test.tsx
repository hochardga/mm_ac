import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, test, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-sans" }),
  Geist_Mono: () => ({ variable: "font-mono" }),
}));

import RootLayout, { metadata } from "@/app/layout";

afterEach(() => {
  delete process.env.VERCEL;
  delete process.env.DATABASE_DRIVER;
});

test("exports Ashfall metadata values", () => {
  expect(metadata).toMatchObject({
    title: "Ashfall Collective",
    description: "Report to your handler. First cases incoming.",
  });
});

test("does not show the reset-warning banner for hosted postgres deployments", () => {
  process.env.VERCEL = "1";
  process.env.DATABASE_DRIVER = "postgres";

  const markup = renderToStaticMarkup(
    <RootLayout>
      <div>Child content</div>
    </RootLayout>,
  );

  expect(markup).not.toMatch(/demo environment: progress may reset occasionally/i);
});

test("does not show the demo reset notice on non-vercel environments", () => {
  delete process.env.VERCEL;

  const markup = renderToStaticMarkup(
    <RootLayout>
      <div>Child content</div>
    </RootLayout>,
  );

  expect(markup).not.toMatch(/demo environment: progress may reset occasionally/i);
});
