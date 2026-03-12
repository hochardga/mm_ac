import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-sans" }),
  Geist_Mono: () => ({ variable: "font-mono" }),
}));

import RootLayout from "@/app/layout";

afterEach(() => {
  delete process.env.VERCEL;
});

test("shows the demo reset notice on vercel deployments", () => {
  process.env.VERCEL = "1";

  render(
    <RootLayout>
      <div>Child content</div>
    </RootLayout>,
  );

  expect(
    screen.getByText(/demo environment: progress may reset occasionally/i),
  ).toBeInTheDocument();
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
