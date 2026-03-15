import { beforeEach, expect, test, vi } from "vitest";

const { withAuthMock } = vi.hoisted(() => ({
  withAuthMock: vi.fn((config) => config),
}));

vi.mock("next-auth/middleware", () => ({
  withAuth: withAuthMock,
}));

vi.mock("@/lib/auth-config", () => ({
  resolveAuthSecret: () => "test-secret",
}));

type CookieMap = Record<string, string | undefined>;

function createRequest(pathname: string, cookies: CookieMap = {}) {
  return {
    nextUrl: { pathname },
    cookies: {
      get(name: string) {
        const value = cookies[name];
        return value ? { value } : undefined;
      },
    },
  };
}

beforeEach(() => {
  vi.resetModules();
  withAuthMock.mockClear();
});

test("protected routes allow cookie-backed identity only when agent id is present", async () => {
  await import("@/proxy");
  const authConfig = withAuthMock.mock.calls[0]?.[0];

  expect(authConfig).toBeTruthy();

  expect(
    authConfig?.callbacks?.authorized({
      req: createRequest("/vault", {
        "ashfall-agent-id": "agent-1",
        "ashfall-onboarding": "active",
      }),
      token: null,
    }),
  ).toBe(true);

  expect(
    authConfig?.callbacks?.authorized({
      req: createRequest("/vault", {
        "ashfall-onboarding": "active",
      }),
      token: null,
    }),
  ).toBe(false);
});
