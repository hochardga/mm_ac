import { fireEvent, render, screen } from "@testing-library/react";

import { PhotoEvidenceView } from "@/features/cases/components/photo-evidence-view";

function renderPhotoEvidenceView() {
  return render(
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
}

test("shows Source, Date: Unknown, opens a larger preview, and closes it", () => {
  renderPhotoEvidenceView();

  expect(screen.getByText(/source:\s*parish evidence locker/i)).toBeInTheDocument();
  expect(screen.getByText(/date:\s*unknown/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /open larger preview/i }));

  expect(
    screen.getByRole("dialog", { name: /vestry scene photo/i }),
  ).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: /close preview/i }));

  expect(
    screen.queryByRole("dialog", { name: /vestry scene photo/i }),
  ).not.toBeInTheDocument();
});

test("closes the larger preview when Escape is pressed", () => {
  renderPhotoEvidenceView();

  fireEvent.click(screen.getByRole("button", { name: /open larger preview/i }));

  expect(
    screen.getByRole("dialog", { name: /vestry scene photo/i }),
  ).toBeInTheDocument();

  fireEvent.keyDown(document, { key: "Escape" });

  expect(
    screen.queryByRole("dialog", { name: /vestry scene photo/i }),
  ).not.toBeInTheDocument();
});
