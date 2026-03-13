import { fireEvent, render, screen, waitFor } from "@testing-library/react";
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

function fillCredentials() {
  fireEvent.change(screen.getByPlaceholderText(/agent@ashfall\.local/i), {
    target: { value: "agent@ashfall.local" },
  });
  fireEvent.change(screen.getByPlaceholderText(/clearance phrase/i), {
    target: { value: "classified-value" },
  });
}

test("shows pending state while credentials are submitting", async () => {
  signInMock.mockReturnValueOnce(new Promise(() => {}));

  render(<SignInPage />);

  fillCredentials();

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

test("prevents re-entrant submits while request is pending", async () => {
  signInMock.mockReturnValue(new Promise(() => {}));

  render(<SignInPage />);
  fillCredentials();

  const submitButton = screen.getByRole("button", { name: /report in/i });
  const form = submitButton.closest("form");
  expect(form).not.toBeNull();
  if (!form) {
    throw new Error("Expected sign-in form");
  }

  fireEvent.submit(form);
  await waitFor(() => expect(submitButton).toBeDisabled());
  fireEvent.submit(form);

  expect(signInMock).toHaveBeenCalledTimes(1);
});

test("shows a user-facing error and resets pending when signIn throws", async () => {
  signInMock.mockRejectedValueOnce(new Error("network down"));

  render(<SignInPage />);
  fillCredentials();

  const submitButton = screen.getByRole("button", { name: /report in/i });
  fireEvent.click(submitButton);

  expect(submitButton).toBeDisabled();
  expect(submitButton).toHaveTextContent("Reporting In...");
  await waitFor(() => expect(submitButton).not.toBeDisabled());
  expect(submitButton).toHaveTextContent("Report In");
  expect(
    screen.getByText(/unable to reach ashfall intake\. try again\./i),
  ).toBeInTheDocument();
});
