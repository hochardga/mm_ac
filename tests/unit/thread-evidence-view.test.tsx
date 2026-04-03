import { render, screen } from "@testing-library/react";

import { ThreadEvidenceView } from "@/features/cases/components/thread-evidence-view";

test("renders interview threads as a transcript spine", () => {
  const { container } = render(
    <ThreadEvidenceView
      evidence={{
        id: "archive-thread",
        title: "Archive Thread",
        family: "thread",
        subtype: "interview_thread",
        summary: "A short interview transcript.",
        source: "evidence/archive-thread.json",
        thread: {
          subject: "Showcase archive routing",
          channel: "Operations relay",
          participants: ["Handler Rowan", "Archivist Mira Sol"],
        },
        messages: [
          {
            id: "thread-1",
            sender: "Handler Rowan",
            timestamp: "2026-03-20T05:15:00Z",
            body: "Start with the archive brief.",
          },
        ],
      }}
    />,
  );

  expect(screen.getByText(/showcase archive routing/i)).toBeInTheDocument();
  expect(screen.getByText(/^speaker$/i)).toBeInTheDocument();
  expect(screen.getByText(/turn 1/i)).toBeInTheDocument();
  expect(
    container.querySelector("[data-thread-variant='interview_thread']"),
  ).toBeInTheDocument();
});
