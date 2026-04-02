import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { CaseClosingNarrative } from "@/features/cases/components/case-closing-narrative";

beforeEach(() => {
  vi.restoreAllMocks();
});

test("renders transcript-only closing narration when audio is absent", () => {
  render(
    <CaseClosingNarrative
      caseSlug="hollow-bishop"
      caseName="The Hollow Bishop"
      closingNarrative={{
        transcript: "Quinn poisoned the sacramental wine.",
      }}
    />,
  );

  expect(
    screen.getByText(/quinn poisoned the sacramental wine\./i),
  ).toBeInTheDocument();
  expect(
    screen.queryByLabelText(/closing narration audio/i),
  ).toBeNull();
  expect(
    screen.queryByRole("button", { name: /play closing narration/i }),
  ).toBeNull();
});

test("renders native audio controls and attempts autoplay when audio exists", async () => {
  const playMock = vi
    .spyOn(HTMLMediaElement.prototype, "play")
    .mockResolvedValue(undefined);

  render(
    <CaseClosingNarrative
      caseSlug="hollow-bishop"
      caseName="The Hollow Bishop"
      closingNarrative={{
        transcript: "Quinn poisoned the sacramental wine.",
        audioPath: "closing/solved/audio.mp3",
      }}
    />,
  );

  await waitFor(() => {
    expect(playMock).toHaveBeenCalledTimes(1);
  });

  expect(screen.getByLabelText(/closing narration audio/i)).toBeInTheDocument();
  expect(
    screen.getByLabelText(/closing narration audio/i),
  ).toHaveAttribute("controls");
  expect(
    screen.queryByRole("button", { name: /play closing narration/i }),
  ).toBeNull();
});

test("re-attempts autoplay when the audio source changes", async () => {
  const playMock = vi
    .spyOn(HTMLMediaElement.prototype, "play")
    .mockResolvedValue(undefined);

  const { rerender } = render(
    <CaseClosingNarrative
      caseSlug="hollow-bishop"
      caseName="The Hollow Bishop"
      closingNarrative={{
        transcript: "Quinn poisoned the sacramental wine.",
        audioPath: "closing/solved/audio.mp3",
      }}
    />,
  );

  await waitFor(() => {
    expect(playMock).toHaveBeenCalledTimes(1);
  });

  rerender(
    <CaseClosingNarrative
      caseSlug="hollow-bishop"
      caseName="The Hollow Bishop"
      closingNarrative={{
        transcript: "Quinn poisoned the sacramental wine.",
        audioPath: "closing/solved/audio.m4a",
      }}
    />,
  );

  await waitFor(() => {
    expect(playMock).toHaveBeenCalledTimes(2);
  });
});
