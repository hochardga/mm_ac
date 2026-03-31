import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { SystemIntroPanel } from "@/features/the-system-intro/components/system-intro-panel";

beforeEach(() => {
  vi.restoreAllMocks();
});

test("autoplay success does not show the play fallback", async () => {
  const playMock = vi
    .spyOn(HTMLMediaElement.prototype, "play")
    .mockResolvedValueOnce(undefined);

  render(
    <SystemIntroPanel
      transcript={"[pause]\nLine two.\n"}
      audioSrc="/api/the-system-intro/audio"
    />,
  );

  await waitFor(() => {
    expect(playMock).toHaveBeenCalledTimes(1);
  });

  expect(screen.queryByRole("button", { name: /play audio/i })).toBeNull();
});

test("autoplay rejection exposes a visible play fallback", async () => {
  vi.spyOn(HTMLMediaElement.prototype, "play")
    .mockRejectedValueOnce(new Error("blocked"))
    .mockResolvedValueOnce(undefined);

  render(
    <SystemIntroPanel
      transcript={"[pause]\nLine two.\n"}
      audioSrc="/api/the-system-intro/audio"
    />,
  );

  await waitFor(() => {
    expect(screen.getByRole("button", { name: /play audio/i })).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole("button", { name: /play audio/i }));
  expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(2);
});
