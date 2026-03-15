import { render, screen } from "@testing-library/react";

import { EvidenceIndex } from "@/features/cases/components/evidence-index";

test("marks the selected evidence link as the current page", () => {
  render(
    <EvidenceIndex
      caseSlug="red-harbor"
      evidence={[
        {
          id: "dispatch-log",
          title: "Dispatch Log",
          family: "record",
          subtype: "dispatcher_log",
          summary: "A midnight distress burst from a dead channel.",
          source: "evidence/dispatch-log.json",
          columns: [],
          rows: [],
        },
        {
          id: "night-watch-thread",
          title: "Night Watch Exchange",
          family: "thread",
          subtype: "handler_message",
          summary: "A late shift exchange about the signal room.",
          source: "evidence/night-watch-thread.json",
          thread: {
            subject: "Night watch exchange",
          },
          messages: [],
        },
      ]}
      newEvidenceIds={["dispatch-log"]}
      selectedEvidenceId="night-watch-thread"
    />,
  );

  expect(
    screen.getByRole("link", { name: /viewing night watch exchange/i }),
  ).toHaveAttribute("aria-current", "page");
  expect(
    screen.getByRole("link", { name: /open dispatch log/i }),
  ).not.toHaveAttribute("aria-current");
  expect(screen.getByText("New")).toBeInTheDocument();
});
