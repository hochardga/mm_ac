import { beforeEach, expect, test, vi } from "vitest";

const { cookiesMock, setCookieMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
  setCookieMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

import { POST } from "@/app/api/intake-signout/route";

beforeEach(() => {
  cookiesMock.mockReset();
  setCookieMock.mockReset();
  cookiesMock.mockResolvedValue({ set: setCookieMock });
});

test("expires intake cookies for agent identity and onboarding state", async () => {
  const response = await POST();

  expect(response.status).toBe(204);
  expect(setCookieMock).toHaveBeenCalledTimes(2);
  expect(setCookieMock).toHaveBeenCalledWith(
    "ashfall-agent-id",
    "",
    expect.objectContaining({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: expect.any(Date),
    }),
  );
  expect(setCookieMock).toHaveBeenCalledWith(
    "ashfall-onboarding",
    "",
    expect.objectContaining({
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      expires: expect.any(Date),
    }),
  );
});
