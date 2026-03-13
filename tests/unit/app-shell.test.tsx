import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import ShellLayout from "@/app/(shell)/layout";
import HomePage from "@/app/(shell)/page";
import { NonCaseShell } from "@/components/non-case-shell";

const usePathnameMock = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

beforeEach(() => {
  usePathnameMock.mockReset();
  usePathnameMock.mockReturnValue("/");
});

test("renders NonCaseShell primary navigation around children", () => {
  render(
    <NonCaseShell>
      <p>Inner route content</p>
    </NonCaseShell>,
  );

  expect(screen.getByRole("navigation", { name: /primary/i })).toBeInTheDocument();
  expect(screen.getByText("Inner route content")).toBeInTheDocument();
});

test("shell layout wraps home route with primary nav and apply CTA styling", () => {
  render(
    <ShellLayout>
      <HomePage />
    </ShellLayout>,
  );

  expect(screen.getByRole("navigation", { name: /primary/i })).toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /apply for field status/i }),
  ).toHaveClass("bg-stone-950");
});
