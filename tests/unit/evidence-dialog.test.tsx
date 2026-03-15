import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

const { routerPushMock } = vi.hoisted(() => ({
  routerPushMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: routerPushMock,
  }),
}));

import { EvidenceDialog } from "@/features/cases/components/evidence-dialog";

afterEach(() => {
  routerPushMock.mockReset();
  document.body.style.overflow = "";
  document.body.innerHTML = "";
});

test("traps focus inside the evidence dialog and hides background content while open", () => {
  const { rerender } = render(
    <main data-testid="workspace-shell">
      <button type="button">Open Evidence</button>
    </main>,
  );

  const openButton = screen.getByRole("button", { name: /open evidence/i });
  openButton.focus();

  rerender(
    <>
      <main data-testid="workspace-shell">
        <button type="button">Open Evidence</button>
      </main>
      <EvidenceDialog
        closeHref="/cases/red-harbor#evidence-dispatch-log"
        title="Dispatch Log"
      >
        <button type="button">Inspect Transcript</button>
      </EvidenceDialog>
    </>,
  );

  const dialog = screen.getByRole("dialog", { name: /dispatch log/i });
  const closeLink = screen.getByRole("link", { name: /close evidence/i });
  const childButton = screen.getByRole("button", { name: /inspect transcript/i });
  const background = screen.getByTestId("workspace-shell");
  const backgroundShell = background.parentElement;

  expect(closeLink).toHaveFocus();
  expect(dialog).toHaveAttribute("aria-modal", "true");
  expect(backgroundShell).toHaveAttribute("aria-hidden", "true");
  expect(backgroundShell).toHaveAttribute("inert");
  expect(document.body.style.overflow).toBe("hidden");

  childButton.focus();
  fireEvent.keyDown(document, { key: "Tab" });
  expect(closeLink).toHaveFocus();

  closeLink.focus();
  fireEvent.keyDown(document, { key: "Tab", shiftKey: true });
  expect(childButton).toHaveFocus();
});

test("navigates to the close target on Escape and restores focus when the dialog closes", () => {
  const { rerender } = render(
    <main data-testid="workspace-shell">
      <button type="button">Open Evidence</button>
    </main>,
  );

  const openButton = screen.getByRole("button", { name: /open evidence/i });
  openButton.focus();

  rerender(
    <>
      <main data-testid="workspace-shell">
        <button type="button">Open Evidence</button>
      </main>
      <EvidenceDialog
        closeHref="/cases/red-harbor#evidence-dispatch-log"
        title="Dispatch Log"
      >
        <button type="button">Inspect Transcript</button>
      </EvidenceDialog>
    </>,
  );

  fireEvent.keyDown(document, { key: "Escape" });

  expect(routerPushMock).toHaveBeenCalledWith(
    "/cases/red-harbor#evidence-dispatch-log",
  );

  rerender(
    <main data-testid="workspace-shell">
      <button type="button">Open Evidence</button>
    </main>,
  );

  expect(screen.getByRole("button", { name: /open evidence/i })).toHaveFocus();
  expect(screen.getByTestId("workspace-shell").parentElement).not.toHaveAttribute(
    "aria-hidden",
  );
  expect(screen.getByTestId("workspace-shell").parentElement).not.toHaveAttribute(
    "inert",
  );
  expect(document.body.style.overflow).toBe("");
});
