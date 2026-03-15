import { render, screen } from "@testing-library/react";

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

test("shows Source and Date without a nested preview control", () => {
  renderPhotoEvidenceView();

  expect(screen.getByText(/source:\s*parish evidence locker/i)).toBeInTheDocument();
  expect(screen.getByText(/date:\s*unknown/i)).toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /open larger preview/i }),
  ).not.toBeInTheDocument();
});
