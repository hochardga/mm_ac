import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const { signOutMock } = vi.hoisted(() => ({
  signOutMock: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signOut: signOutMock,
}));

import { SignOutButton } from "@/components/sign-out-button";

beforeEach(() => {
  signOutMock.mockReset();
});

test("calls signOut and shows pending state while sign-out is unresolved", () => {
  signOutMock.mockReturnValueOnce(new Promise(() => {}));

  render(<SignOutButton />);

  const button = screen.getByRole("button", { name: /sign out/i });
  fireEvent.click(button);

  expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: "/" });
  expect(button).toBeDisabled();
  expect(button).toHaveTextContent("Signing Out...");
});
