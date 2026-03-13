import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const { useFormStatusMock } = vi.hoisted(() => ({
  useFormStatusMock: vi.fn(),
}));

vi.mock("react-dom", async () => {
  const actual = await vi.importActual<typeof import("react-dom")>("react-dom");

  return {
    ...actual,
    useFormStatus: useFormStatusMock,
  };
});

import { ReportActionButton } from "@/features/cases/components/report-action-button";

beforeEach(() => {
  useFormStatusMock.mockReset();
  useFormStatusMock.mockReturnValue({
    pending: false,
    data: null,
    method: "post",
    action: null,
  });
});

test("shows a pending label for the clicked action while the form is submitting", () => {
  const { rerender } = render(
    <ReportActionButton
      idleLabel="Save Draft"
      pendingLabel="Saving Draft..."
      className="rounded-full"
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: /save draft/i }));

  useFormStatusMock.mockReturnValue({
    pending: true,
    data: null,
    method: "post",
    action: null,
  });

  rerender(
    <ReportActionButton
      idleLabel="Save Draft"
      pendingLabel="Saving Draft..."
      className="rounded-full"
    />,
  );

  expect(
    screen.getByRole("button", { name: /saving draft/i }),
  ).toBeDisabled();
});

test("restores the idle label when the submission finishes", () => {
  const { rerender } = render(
    <ReportActionButton
      idleLabel="Submit Report"
      pendingLabel="Submitting Report..."
      className="rounded-full"
    />,
  );

  fireEvent.click(screen.getByRole("button", { name: /submit report/i }));

  useFormStatusMock.mockReturnValue({
    pending: true,
    data: null,
    method: "post",
    action: null,
  });

  rerender(
    <ReportActionButton
      idleLabel="Submit Report"
      pendingLabel="Submitting Report..."
      className="rounded-full"
    />,
  );

  useFormStatusMock.mockReturnValue({
    pending: false,
    data: null,
    method: "post",
    action: null,
  });

  rerender(
    <ReportActionButton
      idleLabel="Submit Report"
      pendingLabel="Submitting Report..."
      className="rounded-full"
    />,
  );

  expect(screen.getByRole("button", { name: /submit report/i })).toHaveTextContent(
    "Submit Report",
  );
});
