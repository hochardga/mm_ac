import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const { getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

import HomePage from "@/app/page";

beforeEach(() => {
  getServerSessionMock.mockReset();
});

test("signed-out home page has no primary nav and offers sign in", async () => {
  getServerSessionMock.mockResolvedValue(null);

  render(await HomePage());

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
