import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

const { routerReplaceMock } = vi.hoisted(() => ({
  routerReplaceMock: vi.fn(),
}));

const { markIntroductionSeenActionMock } = vi.hoisted(() => ({
  markIntroductionSeenActionMock: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: routerReplaceMock,
  }),
}));

vi.mock("@/app/(app)/cases/[caseSlug]/actions", () => ({
  markIntroductionSeenAction: markIntroductionSeenActionMock,
}));

import { CaseIntroductionModal } from "@/features/cases/components/case-introduction-modal";

beforeEach(() => {
  markIntroductionSeenActionMock.mockReset();
  markIntroductionSeenActionMock.mockResolvedValue(undefined);
  routerReplaceMock.mockReset();
});

afterEach(() => {
  document.body.style.overflow = "";
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

test("the modal focuses close or play correctly and restores focus on close", async () => {
  const playMock = vi
    .spyOn(HTMLMediaElement.prototype, "play")
    .mockRejectedValueOnce(new Error("blocked"));
  window.location.hash = "#evidence-vestry-interview";

  const { rerender } = render(
    <main data-testid="workspace-shell">
      <button type="button">Open Introduction</button>
    </main>,
  );

  const openButton = screen.getByRole("button", { name: /open introduction/i });
  openButton.focus();

  rerender(
    <>
      <main data-testid="workspace-shell">
        <button type="button">Open Introduction</button>
      </main>
      <CaseIntroductionModal
        caseName="The Hollow Bishop"
        caseSlug="hollow-bishop"
        closeHref="/cases/hollow-bishop"
        intro={{
          transcript: "# Introduction\n\nThe booth light cut out first.",
          audioPath: "introduction/audio.mp3",
        }}
        open
        playerCaseId="player-case-1"
      />
    </>,
  );

  expect(
    screen.getByRole("dialog", { name: /introduction for the hollow bishop/i }),
  ).toBeInTheDocument();

  await waitFor(() => {
    expect(markIntroductionSeenActionMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /play introduction/i })).toHaveFocus();
  });
  expect(playMock).toHaveBeenCalledTimes(1);

  playMock.mockReset();
  playMock.mockResolvedValue(undefined);

  fireEvent.click(screen.getByRole("link", { name: /close introduction/i }));

  expect(routerReplaceMock).toHaveBeenCalledWith(
    "/cases/hollow-bishop#evidence-vestry-interview",
  );

  rerender(
    <main data-testid="workspace-shell">
      <button type="button">Open Introduction</button>
    </main>,
  );

  expect(screen.getByRole("button", { name: /open introduction/i })).toHaveFocus();
});

test("renders transcript-only introductions without audio controls", async () => {
  render(
    <CaseIntroductionModal
      caseName="Signal at Red Harbor"
      caseSlug="red-harbor"
      intro={{ transcript: "# Introduction\n\nThe signal failed." }}
      open
      playerCaseId="player-case-2"
    />,
  );

  await waitFor(() => {
    expect(markIntroductionSeenActionMock).toHaveBeenCalledTimes(1);
  });

  expect(
    screen.getByRole("heading", { level: 2, name: /introduction/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/the signal failed/i),
  ).toBeInTheDocument();
  expect(screen.queryByLabelText(/introduction audio/i)).toBeNull();
  expect(screen.queryByRole("button", { name: /play introduction/i })).toBeNull();
});

test("attempts audio playback on open and focuses close when autoplay succeeds", async () => {
  const playMock = vi
    .spyOn(HTMLMediaElement.prototype, "play")
    .mockResolvedValueOnce(undefined);

  render(
    <CaseIntroductionModal
      caseName="Signal at Red Harbor"
      caseSlug="red-harbor"
      intro={{
        transcript: "# Introduction\n\nThe signal failed.",
        audioPath: "introduction/audio.mp3",
      }}
      open
      playerCaseId="player-case-3"
    />,
  );

  await waitFor(() => {
    expect(playMock).toHaveBeenCalledTimes(1);
    expect(markIntroductionSeenActionMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /close introduction/i })).toHaveFocus();
  });
});
