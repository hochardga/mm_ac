import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-sans" }),
  Geist_Mono: () => ({ variable: "font-mono" }),
}));

import RootLayout from "@/app/layout";

afterEach(() => {
  delete process.env.VERCEL;
  delete process.env.DATABASE_DRIVER;
});

test("does not show the reset-warning banner for hosted postgres deployments", () => {
  process.env.VERCEL = "1";
  process.env.DATABASE_DRIVER = "postgres";

  render(
    <RootLayout>
      <div>Child content</div>
    </RootLayout>,
  );

  expect(
    screen.queryByText(/demo environment: progress may reset occasionally/i),
  ).not.toBeInTheDocument();
});

test("does not show the demo reset notice on non-vercel environments", () => {
  delete process.env.VERCEL;

  render(
    <RootLayout>
      <div>Child content</div>
    </RootLayout>,
  );

  expect(
    screen.queryByText(/demo environment: progress may reset occasionally/i),
  ).not.toBeInTheDocument();
});
