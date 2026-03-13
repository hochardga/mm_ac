import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const { cookiesMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
}));
const { getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
}));
const { listAvailableCasesMock } = vi.hoisted(() => ({
  listAvailableCasesMock: vi.fn(),
}));
const { pushMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
}));
const usePathnameMock = vi.fn();

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => usePathnameMock(),
}));

vi.mock("@/features/cases/list-available-cases", () => ({
  listAvailableCases: listAvailableCasesMock,
}));

import ApplyPage from "@/app/(shell)/apply/page";
import ShellLayout from "@/app/(shell)/layout";
import SignInPage from "@/app/(shell)/signin/page";
import VaultPage from "@/app/(shell)/vault/page";

beforeEach(() => {
  cookiesMock.mockReset();
  cookiesMock.mockResolvedValue({ get: vi.fn() });
  getServerSessionMock.mockReset();
  getServerSessionMock.mockResolvedValue(null);
  listAvailableCasesMock.mockReset();
  listAvailableCasesMock.mockResolvedValue([]);
  pushMock.mockReset();
  usePathnameMock.mockReset();
  usePathnameMock.mockReturnValue("/apply");
});

test("signed-out apply route inside shell shows apply and sign in only", async () => {
  getServerSessionMock.mockResolvedValueOnce(null);
  render(await ShellLayout({ children: <ApplyPage /> }));

  expect(
    screen.getByRole("heading", { name: /apply for field status/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /apply/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /vault/i })).not.toBeInTheDocument();
});

test("signed-out signin route inside shell shows apply and sign in only", async () => {
  getServerSessionMock.mockResolvedValueOnce(null);
  usePathnameMock.mockReturnValue("/signin");
  render(await ShellLayout({ children: <SignInPage /> }));

  expect(
    screen.getByRole("heading", { name: /return to ashfall/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /apply/i })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /vault/i })).not.toBeInTheDocument();
});

test("signed-in vault route inside shell shows vault and sign out with styled header", async () => {
  getServerSessionMock.mockResolvedValue({ user: { id: "agent-12" } });
  usePathnameMock.mockReturnValue("/vault");
  render(await ShellLayout({ children: await VaultPage() }));

  expect(
    screen.getByRole("heading", { name: /dossier vault/i }),
  ).toBeInTheDocument();
  expect(screen.getByRole("link", { name: /vault/i })).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /sign out/i }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /sign in/i }),
  ).not.toBeInTheDocument();
  expect(screen.getByRole("banner")).toHaveClass("border-b");
  expect(screen.getByRole("banner")).toHaveClass("bg-stone-100/95");
});
