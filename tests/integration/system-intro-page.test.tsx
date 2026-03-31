import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

const { cookiesMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
}));
const { getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
}));
const { redirectMock, notFoundMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  }),
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  notFound: notFoundMock,
}));

import SystemIntroPage from "@/app/(app)/the-system-intro/page";
import * as systemIntroLoader from "@/features/the-system-intro/load-system-intro";

afterEach(() => {
  vi.restoreAllMocks();
  cookiesMock.mockReset();
  getServerSessionMock.mockReset();
  redirectMock.mockClear();
  notFoundMock.mockClear();
});

function setAuthenticatedSession(userId: string) {
  getServerSessionMock.mockResolvedValue({ user: { id: userId } });
  cookiesMock.mockResolvedValue({
    get: () => undefined,
  });
}

function setUnauthenticatedSession() {
  getServerSessionMock.mockResolvedValue(null);
  cookiesMock.mockResolvedValue({
    get: () => undefined,
  });
}

test("authenticated page renders transcript and vault CTA", async () => {
  setAuthenticatedSession("agent-1");
  vi.spyOn(systemIntroLoader, "loadSystemIntro").mockResolvedValue({
    transcript: "[pause]\nLine two.\n",
    audioPath: undefined,
  });

  render(await SystemIntroPage());

  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
    /the system/i,
  );
  expect(screen.getByTestId("system-intro-transcript").textContent).toBe(
    "[pause]\nLine two.\n",
  );
  expect(screen.getByRole("link", { name: /proceed to vault/i })).toHaveAttribute(
    "href",
    "/vault",
  );
});

test("unauthenticated requests redirect to /signin", async () => {
  setUnauthenticatedSession();
  const loaderSpy = vi.spyOn(systemIntroLoader, "loadSystemIntro");

  await expect(SystemIntroPage()).rejects.toThrow("NEXT_REDIRECT:/signin");
  expect(redirectMock).toHaveBeenCalledWith("/signin");
  expect(loaderSpy).not.toHaveBeenCalled();
});

test("missing transcript fails closed with notFound", async () => {
  setAuthenticatedSession("agent-2");
  vi.spyOn(systemIntroLoader, "loadSystemIntro").mockResolvedValue(null);

  await expect(SystemIntroPage()).rejects.toThrow("NEXT_NOT_FOUND");
  expect(notFoundMock).toHaveBeenCalledTimes(1);
});
