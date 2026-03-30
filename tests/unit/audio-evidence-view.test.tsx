import { render, screen } from "@testing-library/react";

import { AudioEvidenceView } from "@/features/cases/components/audio-evidence-view";

test("audio viewer shows source metadata, player, and transcript", () => {
  render(
    <AudioEvidenceView
      caseSlug="media-family-valid"
      evidence={{
        id: "dispatch-voicemail",
        title: "Dispatch Voicemail",
        family: "audio",
        subtype: "voicemail",
        summary: "A short archived dispatch clip.",
        source: "evidence/dispatch-voicemail.json",
        audio: "evidence/dispatch-voicemail.wav",
        transcript: "Check pier locker seven.",
        sourceLabel: "Harbor dispatch archive",
      }}
    />,
  );

  expect(
    screen.getByText(/source:\s*harbor dispatch archive/i),
  ).toBeInTheDocument();
  expect(screen.getByLabelText(/audio playback/i)).toBeInTheDocument();
  expect(screen.getByText(/check pier locker seven/i)).toBeInTheDocument();
});
