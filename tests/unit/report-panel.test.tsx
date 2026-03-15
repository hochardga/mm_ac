import { render, screen, within } from "@testing-library/react";

import { ReportPanel } from "@/features/cases/components/report-panel";

test("renders submit-first report actions and explicit report feedback", () => {
  render(
    <ReportPanel
      caseSlug="legacy-case"
      playerCaseId="player-case-1"
      latestSubmission={
        {
          id: "submission-1",
          playerCaseId: "player-case-1",
          submissionToken: "token-1",
          suspectId: "suspect-a",
          motiveId: "motive-a",
          methodId: "method-a",
          attemptNumber: 1,
          nextStatus: "in_progress",
          feedback: "The motive still does not align with the dock records.",
          createdAt: new Date("2026-03-15T00:00:00.000Z"),
        } as never
      }
      manifest={
        {
          reportOptions: {
            suspect: [{ id: "suspect-a", label: "Suspect A" }],
            motive: [{ id: "motive-a", label: "Motive A" }],
            method: [{ id: "method-a", label: "Method A" }],
          },
        } as never
      }
      savedDraft={undefined}
      submissionToken="token-2"
    />,
  );

  const reportSection = screen
    .getByRole("heading", { name: /draft report/i })
    .closest("section");
  expect(reportSection).not.toBeNull();
  expect(
    within(reportSection as HTMLElement).getByText(/incorrect report \/ attempt 1/i),
  ).toBeInTheDocument();
  expect(
    within(reportSection as HTMLElement)
      .getAllByRole("button")
      .map((button) => button.textContent?.trim()),
  ).toEqual(["Submit Report", "Save Draft"]);
});
