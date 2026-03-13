import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const { cookiesMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
}));
const { getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
}));
const { authOptionsMock } = vi.hoisted(() => ({
  authOptionsMock: {},
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));
vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));
vi.mock("@/lib/auth", () => ({
  authOptions: authOptionsMock,
}));

import HomePage from "@/app/page";

beforeEach(() => {
  cookiesMock.mockReset();
  cookiesMock.mockResolvedValue({ get: vi.fn() });
  getServerSessionMock.mockReset();
});

test("signed-out home page has no primary nav and offers sign in", async () => {
  getServerSessionMock.mockResolvedValue(null);

  render(await HomePage());

  expect(getServerSessionMock).toHaveBeenCalledWith(authOptionsMock);
  expect(
    screen.queryByRole("navigation", { name: /primary/i }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /apply for field status/i }),
  ).toHaveAttribute("href", "/apply");
  expect(
    screen.getByRole("link", { name: /returning agent sign in/i }),
  ).toHaveAttribute("href", "/signin");
  expect(
    screen.queryByRole("link", { name: /open vault/i }),
  ).not.toBeInTheDocument();
});

test("signed-in home page swaps sign in for open vault", async () => {
  getServerSessionMock.mockResolvedValue({
    user: { id: "agent-1" },
  });

  render(await HomePage());

  expect(getServerSessionMock).toHaveBeenCalledWith(authOptionsMock);
  expect(
    screen.queryByRole("navigation", { name: /primary/i }),
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("link", { name: /open vault/i }),
  ).toHaveAttribute("href", "/vault");
  expect(
    screen.queryByRole("link", { name: /returning agent sign in/i }),
  ).not.toBeInTheDocument();
});

test("cookie-backed home page also swaps sign in for open vault", async () => {
  getServerSessionMock.mockResolvedValue(null);
  cookiesMock.mockResolvedValue({
    get: vi.fn((name: string) =>
      name === "ashfall-agent-id" ? { value: "agent-1" } : undefined,
    ),
  });

  render(await HomePage());

  expect(
    screen.getByRole("link", { name: /open vault/i }),
  ).toHaveAttribute("href", "/vault");
  expect(
    screen.queryByRole("link", { name: /returning agent sign in/i }),
  ).not.toBeInTheDocument();
});
