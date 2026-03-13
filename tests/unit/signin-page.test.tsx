import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const { signInMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signIn: signInMock,
}));

import SignInPage from "@/app/(shell)/signin/page";

beforeEach(() => {
  signInMock.mockReset();
});

test("shows pending state while credentials are submitting", async () => {
  signInMock.mockReturnValueOnce(new Promise(() => {}));

  render(<SignInPage />);

  fireEvent.change(screen.getByPlaceholderText(/agent@ashfall\.local/i), {
    target: { value: "agent@ashfall.local" },
  });
  fireEvent.change(screen.getByPlaceholderText(/clearance phrase/i), {
    target: { value: "classified-value" },
  });

  const submitButton = screen.getByRole("button", { name: /report in/i });
  fireEvent.click(submitButton);

  expect(signInMock).toHaveBeenCalledWith("credentials", {
    email: "agent@ashfall.local",
    password: "classified-value",
    callbackUrl: "/vault",
    redirect: false,
  });
  expect(submitButton).toBeDisabled();
  expect(submitButton).toHaveTextContent("Reporting In...");
});
