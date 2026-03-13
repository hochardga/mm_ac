import { render, screen, within } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const { getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
}));
const usePathnameMock = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
}));

import ShellLayout from "@/app/(shell)/layout";
import { NonCaseShell } from "@/components/non-case-shell";

beforeEach(() => {
  getServerSessionMock.mockReset();
  getServerSessionMock.mockResolvedValue(null);
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

test("shell layout wraps generic child content with primary nav", async () => {
  render(await ShellLayout({ children: <p>Shell child content</p> }));

  const navigation = screen.getByRole("navigation", { name: /primary/i });

  expect(navigation).toBeInTheDocument();
  expect(
    within(navigation).getByRole("link", { name: /^apply$/i }),
  ).toHaveAttribute("href", "/apply");
  expect(screen.getByText("Shell child content")).toBeInTheDocument();
});
