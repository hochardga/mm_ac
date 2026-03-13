import { render, screen } from "@testing-library/react";
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

beforeEach(() => {
  getServerSessionMock.mockReset();
  getServerSessionMock.mockResolvedValue(null);
  usePathnameMock.mockReset();
  usePathnameMock.mockReturnValue("/");
});

test("signed-out shell layout shows sign in and hides vault", async () => {
  getServerSessionMock.mockResolvedValueOnce(null);
  render(await ShellLayout({ children: <p>Shell child content</p> }));

  expect(
    screen.getByRole("navigation", { name: /primary/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /vault/i }),
  ).not.toBeInTheDocument();
  expect(screen.getByText("Shell child content")).toBeInTheDocument();
});

test("signed-in shell layout shows vault and sign out while hiding sign in", async () => {
  getServerSessionMock.mockResolvedValueOnce({ user: { id: "agent-7" } });
  render(await ShellLayout({ children: <p>Shell child content</p> }));

  expect(
    screen.getByRole("navigation", { name: /primary/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /vault/i })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /sign out/i }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /sign in/i }),
  ).not.toBeInTheDocument();
});
