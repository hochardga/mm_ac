import { fireEvent, render, screen } from "@testing-library/react";

import { PhotoEvidenceView } from "@/features/cases/components/photo-evidence-view";

test("shows Source, Date: Unknown, and opens a larger preview", () => {
  render(
    <PhotoEvidenceView
      caseSlug="hollow-bishop"
      evidence={{
        id: "vestry-scene-photo",
        title: "Vestry Scene Photo",
        family: "photo",
        subtype: "scene_photo",
        summary: "A still image from the vestry.",
        source: "evidence/vestry-scene-photo.json",
        image: "evidence/vestry-scene-photo.png",
        caption: "The silver chalice lies beside the desk.",
        sourceLabel: "Parish evidence locker",
      }}
    />,
  );

  expect(screen.getByText(/source:\s*parish evidence locker/i)).toBeInTheDocument();
  expect(screen.getByText(/date:\s*unknown/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /open larger preview/i }));

  expect(
    screen.getByRole("dialog", { name: /vestry scene photo/i }),
  ).toBeInTheDocument();
});
