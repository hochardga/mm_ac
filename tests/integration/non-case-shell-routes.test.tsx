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

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("@/features/cases/list-available-cases", () => ({
  listAvailableCases: listAvailableCasesMock,
}));

import ApplyPage from "@/app/(shell)/apply/page";
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
});

test("ApplyPage is served from the shell route group", () => {
  render(<ApplyPage />);

  expect(
    screen.getByRole("heading", { name: /apply for field status/i }),
  ).toBeInTheDocument();
});

test("SignInPage is served from the shell route group", () => {
  render(<SignInPage />);

  expect(
    screen.getByRole("heading", { name: /return to ashfall/i }),
  ).toBeInTheDocument();
});

test("VaultPage is served from the shell route group", async () => {
  render(await VaultPage());

  expect(
    screen.getByRole("heading", { name: /dossier vault/i }),
  ).toBeInTheDocument();
});
