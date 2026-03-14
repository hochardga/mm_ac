import { randomUUID } from "node:crypto";

import { render, screen, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

const { cookiesMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
}));
const { getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
}));
const { notFoundMock, redirectMock } = vi.hoisted(() => ({
  notFoundMock: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
  redirectMock: vi.fn((target: string) => {
    throw new Error(`NEXT_REDIRECT:${target}`);
  }),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("next/navigation", () => ({
  notFound: notFoundMock,
  redirect: redirectMock,
}));

import DebriefPage from "@/app/(app)/cases/[caseSlug]/debrief/page";
import { users } from "@/db/schema";
import { openCase } from "@/features/cases/open-case";
import { submitObjective } from "@/features/submissions/submit-objective";
import { closeDb, getDb } from "@/lib/db";

afterEach(async () => {
  cookiesMock.mockReset();
  getServerSessionMock.mockReset();
  redirectMock.mockClear();
  notFoundMock.mockClear();
  await closeDb();
});

async function seedAuthenticatedUser(alias: string) {
  const db = await getDb();
  const userId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email: `${alias.toLowerCase().replace(/\s+/g, "-")}@example.com`,
    passwordHash: "hashed-password",
    alias,
  });

  getServerSessionMock.mockResolvedValue({
    user: {
      id: userId,
    },
  });
  cookiesMock.mockResolvedValue({
    get: () => undefined,
  });

  return userId;
}

test("renders a solved debrief dossier with final report, reconstruction, and attempts", async () => {
  const userId = await seedAuthenticatedUser("Agent Ember");
  const { playerCase } = await openCase({
    userId,
    caseSlug: "hollow-bishop",
  });

  await submitObjective({
    playerCaseId: playerCase.id,
    objectiveId: "chalice-relevance",
    submissionToken: "solved-token-1",
    payload: {
      type: "boolean",
      value: false,
    },
  });
  await submitObjective({
    playerCaseId: playerCase.id,
    objectiveId: "identify-poisoner",
    submissionToken: "solved-token-2",
    payload: {
      type: "single_choice",
      choiceId: "bookkeeper",
    },
  });

  render(
    await DebriefPage({
      params: Promise.resolve({ caseSlug: "hollow-bishop" }),
    }),
  );

  expect(
    screen.getByRole("heading", { name: /your final report/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /ashfall reconstruction/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /attempt history/i }),
  ).toBeInTheDocument();
  const finalReportSection = screen
    .getByRole("heading", { name: /your final report/i })
    .closest("section");
  const reconstructionSection = screen
    .getByRole("heading", { name: /ashfall reconstruction/i })
    .closest("section");

  expect(finalReportSection).not.toBeNull();
  expect(reconstructionSection).not.toBeNull();
  expect(
    within(finalReportSection as HTMLElement).getByText(
      /was the silver chalice actually the murder weapon\?/i,
    ),
  ).toBeInTheDocument();
  expect(
    within(finalReportSection as HTMLElement).getByText("No"),
  ).toBeInTheDocument();
  expect(
    within(finalReportSection as HTMLElement).getByText(
      /who poisoned the sacramental wine to silence the bishop\?/i,
    ),
  ).toBeInTheDocument();
  expect(
    within(finalReportSection as HTMLElement).getByText("Bookkeeper Mara Quinn"),
  ).toBeInTheDocument();
  expect(
    within(reconstructionSection as HTMLElement).getByText(
      /was the silver chalice actually the murder weapon\?/i,
    ),
  ).toBeInTheDocument();
  expect(
    within(reconstructionSection as HTMLElement).getByText("No"),
  ).toBeInTheDocument();
  expect(
    within(reconstructionSection as HTMLElement).getByText(
      /who poisoned the sacramental wine to silence the bishop\?/i,
    ),
  ).toBeInTheDocument();
  expect(
    within(reconstructionSection as HTMLElement).getByText(
      "Bookkeeper Mara Quinn",
    ),
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole("heading", { name: /attempt history/i }).closest(
      "section",
    ) as HTMLElement).getAllByText(
      /was the silver chalice actually the murder weapon\?/i,
    ),
  ).toHaveLength(1);
  expect(
    within(screen.getByRole("heading", { name: /attempt history/i }).closest(
      "section",
    ) as HTMLElement).getByText("Attempt 1"),
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole("heading", { name: /attempt history/i }).closest(
      "section",
    ) as HTMLElement).getByText("Attempt 2"),
  ).toBeInTheDocument();
  expect(
    within(screen.getByRole("heading", { name: /attempt history/i }).closest(
      "section",
    ) as HTMLElement).getAllByText(
      /who poisoned the sacramental wine to silence the bishop\?/i,
    ),
  ).toHaveLength(1);
  const serviceRecordSection = screen
    .getByRole("heading", { name: /service record/i })
    .closest("section");

  expect(serviceRecordSection).not.toBeNull();
  expect(
    within(serviceRecordSection as HTMLElement).getByText(/1 of 3 dossiers cleared/i),
  ).toBeInTheDocument();
  expect(
    within(serviceRecordSection as HTMLElement).getByText(/1 dossiers cleared/i),
  ).toBeInTheDocument();
  expect(
    within(serviceRecordSection as HTMLElement).getByRole("link", {
      name: /open case file/i,
    }),
  ).toHaveAttribute("href", "/cases/red-harbor");
});

test("renders a closed-unsolved debrief dossier with the player's final theory and solution", async () => {
  const userId = await seedAuthenticatedUser("Agent Harbor");
  const { playerCase } = await openCase({
    userId,
    caseSlug: "red-harbor",
  });

  await submitObjective({
    playerCaseId: playerCase.id,
    objectiveId: "identify-saboteur",
    submissionToken: "miss-1",
    payload: {
      type: "single_choice",
      choiceId: "captain",
    },
  });
  await submitObjective({
    playerCaseId: playerCase.id,
    objectiveId: "identify-saboteur",
    submissionToken: "miss-2",
    payload: {
      type: "single_choice",
      choiceId: "captain",
    },
  });
  await submitObjective({
    playerCaseId: playerCase.id,
    objectiveId: "identify-saboteur",
    submissionToken: "miss-3",
    payload: {
      type: "single_choice",
      choiceId: "captain",
    },
  });

  render(
    await DebriefPage({
      params: Promise.resolve({ caseSlug: "red-harbor" }),
    }),
  );

  expect(
    screen.getByRole("heading", { name: /your final report/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /ashfall reconstruction/i }),
  ).toBeInTheDocument();
  const attemptHistorySection = screen
    .getByRole("heading", { name: /attempt history/i })
    .closest("section");
  const finalReportSection = screen
    .getByRole("heading", { name: /your final report/i })
    .closest("section");
  const reconstructionSection = screen
    .getByRole("heading", { name: /ashfall reconstruction/i })
    .closest("section");

  expect(attemptHistorySection).not.toBeNull();
  expect(finalReportSection).not.toBeNull();
  expect(reconstructionSection).not.toBeNull();
  expect(
    within(finalReportSection as HTMLElement).getByText(
      /who staged the false distress transmission\?/i,
    ),
  ).toBeInTheDocument();
  expect(
    within(finalReportSection as HTMLElement).getByText("Captain Lena Morrow"),
  ).toBeInTheDocument();
  expect(
    within(reconstructionSection as HTMLElement).getByText(
      /who staged the false distress transmission\?/i,
    ),
  ).toBeInTheDocument();
  expect(
    within(reconstructionSection as HTMLElement).getByText(
      "Radio Chief Soren Pike",
    ),
  ).toBeInTheDocument();
  expect(
    within(attemptHistorySection as HTMLElement).getAllByText("In Progress"),
  ).toHaveLength(2);
  expect(
    within(attemptHistorySection as HTMLElement).getByText("Closed Unsolved"),
  ).toBeInTheDocument();
  expect(
    within(attemptHistorySection as HTMLElement).getAllByText(
      /who staged the false distress transmission\?/i,
    ),
  ).toHaveLength(3);
  expect(
    screen.getByText(/red harbor is closed without a prosecutable case/i),
  ).toBeInTheDocument();
  const serviceRecordSection = screen
    .getByRole("heading", { name: /service record/i })
    .closest("section");

  expect(serviceRecordSection).not.toBeNull();
  expect(
    within(serviceRecordSection as HTMLElement).getByText(/0 of 3 dossiers cleared/i),
  ).toBeInTheDocument();
  expect(
    within(serviceRecordSection as HTMLElement).getByText(/1 unresolved closures/i),
  ).toBeInTheDocument();
  expect(
    within(serviceRecordSection as HTMLElement).getByRole("link", {
      name: /open case file/i,
    }),
  ).toHaveAttribute("href", "/cases/briar-ledger");
});
