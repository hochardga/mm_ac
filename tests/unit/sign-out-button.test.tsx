import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const { signOutMock } = vi.hoisted(() => ({
  signOutMock: vi.fn(),
}));
const { fetchMock } = vi.hoisted(() => ({
  fetchMock: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signOut: signOutMock,
}));

import { SignOutButton } from "@/components/sign-out-button";

beforeEach(() => {
  signOutMock.mockReset();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue({ ok: true });
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

test("calls signOut and shows pending state while sign-out is unresolved", async () => {
  signOutMock.mockReturnValueOnce(new Promise(() => {}));

  render(<SignOutButton />);

  const button = screen.getByRole("button", { name: /sign out/i });
  fireEvent.click(button);

  await waitFor(() =>
    expect(fetchMock).toHaveBeenCalledWith("/api/intake-signout", {
      method: "POST",
    }),
  );
  await waitFor(() =>
    expect(signOutMock).toHaveBeenCalledWith({ callbackUrl: "/" }),
  );
  expect(button).toBeDisabled();
  expect(button).toHaveTextContent("Signing Out...");
});

test("clears pending and restores label when signOut rejects", async () => {
  signOutMock.mockRejectedValueOnce(new Error("network down"));

  render(<SignOutButton />);

  const button = screen.getByRole("button", { name: /sign out/i });
  fireEvent.click(button);

  expect(button).toBeDisabled();
  expect(button).toHaveTextContent("Signing Out...");
  await waitFor(() => expect(button).not.toBeDisabled());
  expect(button).toHaveTextContent("Sign Out");
});

test("does not continue to next-auth signout when intake cookie clear request fails", async () => {
  fetchMock.mockRejectedValueOnce(new Error("intake endpoint unavailable"));

  render(<SignOutButton />);

  const button = screen.getByRole("button", { name: /sign out/i });
  fireEvent.click(button);

  await waitFor(() =>
    expect(fetchMock).toHaveBeenCalledWith("/api/intake-signout", {
      method: "POST",
    }),
  );
  await waitFor(() => expect(signOutMock).not.toHaveBeenCalled());
  await waitFor(() => expect(button).not.toBeDisabled());
  expect(button).toHaveTextContent("Sign Out");
});

test("does not continue to next-auth signout when intake cookie clear responds non-ok", async () => {
  fetchMock.mockResolvedValueOnce({ ok: false });

  render(<SignOutButton />);

  const button = screen.getByRole("button", { name: /sign out/i });
  fireEvent.click(button);

  await waitFor(() =>
    expect(fetchMock).toHaveBeenCalledWith("/api/intake-signout", {
      method: "POST",
    }),
  );
  await waitFor(() => expect(signOutMock).not.toHaveBeenCalled());
  await waitFor(() => expect(button).not.toBeDisabled());
  expect(button).toHaveTextContent("Sign Out");
});
