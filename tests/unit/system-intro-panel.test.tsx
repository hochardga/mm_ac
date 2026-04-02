import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { SystemIntroPanel } from "@/features/the-system-intro/components/system-intro-panel";

beforeEach(() => {
  vi.restoreAllMocks();
});

test("autoplay success shows the native audio controls", async () => {
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

  expect(screen.getByLabelText(/system narration audio/i)).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /play audio/i }),
  ).toBeNull();
});

test("autoplay rejection still shows the native audio controls", async () => {
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
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalledTimes(1);
  });

  expect(screen.getByLabelText(/system narration audio/i)).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /play audio/i }),
  ).toBeNull();
});
