import { render, screen } from "@testing-library/react";

import { WebpageEvidenceView } from "@/features/cases/components/webpage-evidence-view";

test("webpage viewer renders structured blocks without raw html injection", () => {
  const { container } = render(
    <WebpageEvidenceView
      evidence={{
        id: "service-directory",
        title: "Service Directory",
        family: "webpage",
        subtype: "directory_listing",
        summary: "A cached intranet listing.",
        source: "evidence/service-directory.json",
        page: {
          title: "Harbor Service Directory",
          urlLabel: "harbor.local/services",
          sourceLabel: "Cached port intranet",
        },
        blocks: [
          {
            id: "intro",
            type: "hero",
            heading: "Night Services",
            body: "Verified services available after the third bell.",
          },
          {
            id: "vendors",
            type: "directory",
            items: [
              {
                title: "Pier Locker Rentals",
                meta: "Warehouse Row",
                body: "After-hours access by coded key.",
              },
            ],
          },
        ],
      }}
    />,
  );

  expect(screen.getByText(/harbor service directory/i)).toBeInTheDocument();
  expect(screen.getByText(/pier locker rentals/i)).toBeInTheDocument();
  expect(container.querySelector("script")).toBeNull();
});
