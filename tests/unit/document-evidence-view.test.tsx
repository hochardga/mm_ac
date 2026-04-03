import { render, screen } from "@testing-library/react";

import { DocumentEvidenceView } from "@/features/cases/components/document-evidence-view";

test("renders document evidence as a scanned paper artifact", () => {
  const { container } = render(
    <DocumentEvidenceView
      evidence={{
        id: "archive-brief",
        title: "Archive Brief",
        family: "document",
        subtype: "case_brief",
        summary: "A top-line training summary.",
        source: "evidence/archive-brief.md",
        body: "This is the body of the brief.",
        meta: {
          sourceLabel: "Ashfall training archive",
          handlingNote: "Use this package to compare every evidence family.",
        },
      }}
    />,
  );

  expect(screen.getByText(/^document$/i)).toBeInTheDocument();
  expect(screen.getByText(/scanned case brief/i)).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /archive brief/i }),
  ).toBeInTheDocument();
  expect(screen.getByText(/this is the body of the brief/i)).toBeInTheDocument();
  expect(
    screen.getByText(/source label:\s*ashfall training archive/i),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/handling note:\s*use this package to compare every evidence family/i),
  ).toBeInTheDocument();
  expect(
    container.querySelector("[data-document-variant='case_brief']"),
  ).toBeInTheDocument();
});
