import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

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

test("webpage viewer tolerates duplicate list items and repeated card titles", () => {
  const consoleErrorSpy = vi
    .spyOn(console, "error")
    .mockImplementation(() => undefined);

  render(
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
        },
        blocks: [
          {
            id: "services",
            type: "list",
            heading: "After-hours services",
            items: ["Pier access", "Pier access"],
          },
          {
            id: "vendors",
            type: "directory",
            items: [
              {
                title: "Night Clerk",
                body: "Monitors the annex desk.",
              },
              {
                title: "Night Clerk",
                body: "Handles late badge logs.",
              },
            ],
          },
        ],
      }}
    />,
  );

  expect(screen.getAllByText(/pier access/i)).toHaveLength(2);
  expect(screen.getAllByText(/night clerk/i)).toHaveLength(2);
  expect(consoleErrorSpy).not.toHaveBeenCalled();

  consoleErrorSpy.mockRestore();
});
