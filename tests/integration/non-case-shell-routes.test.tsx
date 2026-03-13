import { render, screen, within } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const {
  cookiesMock,
  getServerSessionMock,
  listAvailableCasesMock,
  pushMock,
  usePathnameMock,
} = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  getServerSessionMock: vi.fn(),
  listAvailableCasesMock: vi.fn(),
  pushMock: vi.fn(),
  usePathnameMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => usePathnameMock(),
  useRouter: () => ({ push: pushMock }),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("@/features/cases/list-available-cases", () => ({
  listAvailableCases: listAvailableCasesMock,
}));

import ApplyPage from "@/app/(shell)/apply/page";
import ShellLayout from "@/app/(shell)/layout";
import SignInPage from "@/app/(shell)/signin/page";
import VaultPage from "@/app/(shell)/vault/page";

beforeEach(() => {
  usePathnameMock.mockReset();
  usePathnameMock.mockReturnValue("/");
  pushMock.mockReset();
  cookiesMock.mockReset();
  cookiesMock.mockResolvedValue({ get: vi.fn() });
  getServerSessionMock.mockReset();
  getServerSessionMock.mockResolvedValue(null);
  listAvailableCasesMock.mockReset();
  listAvailableCasesMock.mockResolvedValue([]);
});

function expectPrimaryNavigation() {
  const navigation = screen.getByRole("navigation", { name: /primary/i });

  expect(
    within(navigation).getByRole("link", { name: /^apply$/i }),
  ).toHaveAttribute("href", "/apply");
  expect(
    within(navigation).getByRole("link", { name: /sign in/i }),
  ).toHaveAttribute("href", "/signin");
  expect(
    within(navigation).getByRole("link", { name: /vault/i }),
  ).toHaveAttribute("href", "/vault");
}

test("ApplyPage renders inside ShellLayout with shared primary navigation", () => {
  usePathnameMock.mockReturnValue("/apply");

  render(
    <ShellLayout>
      <ApplyPage />
    </ShellLayout>,
  );

  expectPrimaryNavigation();
  expect(
    screen.getByRole("heading", { name: /apply for field status/i }),
  ).toBeInTheDocument();
});

test("SignInPage renders inside ShellLayout with shared primary navigation", () => {
  usePathnameMock.mockReturnValue("/signin");

  render(
    <ShellLayout>
      <SignInPage />
    </ShellLayout>,
  );

  expectPrimaryNavigation();
  expect(
    screen.getByRole("heading", { name: /return to ashfall/i }),
  ).toBeInTheDocument();
});

test("VaultPage renders inside ShellLayout with shared primary navigation", async () => {
  usePathnameMock.mockReturnValue("/vault");

  render(
    <ShellLayout>
      {await VaultPage()}
    </ShellLayout>,
  );

  expectPrimaryNavigation();
  expect(
    screen.getByRole("heading", { name: /dossier vault/i }),
  ).toBeInTheDocument();
});
