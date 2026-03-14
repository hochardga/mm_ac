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
import { submitReport } from "@/features/submissions/submit-report";
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

  await submitReport({
    playerCaseId: playerCase.id,
    submissionToken: "solved-token",
    answers: {
      suspectId: "bookkeeper",
      motiveId: "embezzlement",
      methodId: "poisoned-wine",
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
    within(finalReportSection as HTMLElement).getByText("Bookkeeper Mara Quinn"),
  ).toBeInTheDocument();
  expect(
    within(finalReportSection as HTMLElement).getByText("Embezzlement cover-up"),
  ).toBeInTheDocument();
  expect(
    within(finalReportSection as HTMLElement).getByText(
      "Poisoned sacramental wine",
    ),
  ).toBeInTheDocument();
  expect(
    within(reconstructionSection as HTMLElement).getByText(
      "Bookkeeper Mara Quinn",
    ),
  ).toBeInTheDocument();
});

test("renders a closed-unsolved debrief dossier with the player's final theory and solution", async () => {
  const userId = await seedAuthenticatedUser("Agent Harbor");
  const { playerCase } = await openCase({
    userId,
    caseSlug: "red-harbor",
  });

  await submitReport({
    playerCaseId: playerCase.id,
    submissionToken: "miss-1",
    answers: {
      suspectId: "captain",
      motiveId: "insurance",
      methodId: "drowned",
    },
  });
  await submitReport({
    playerCaseId: playerCase.id,
    submissionToken: "miss-2",
    answers: {
      suspectId: "captain",
      motiveId: "insurance",
      methodId: "drowned",
    },
  });
  await submitReport({
    playerCaseId: playerCase.id,
    submissionToken: "miss-3",
    answers: {
      suspectId: "captain",
      motiveId: "insurance",
      methodId: "drowned",
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
    within(finalReportSection as HTMLElement).getByText("Captain Lena Morrow"),
  ).toBeInTheDocument();
  expect(
    within(finalReportSection as HTMLElement).getByText("Insurance fraud"),
  ).toBeInTheDocument();
  expect(
    within(finalReportSection as HTMLElement).getByText(
      "Forced overboard drowning",
    ),
  ).toBeInTheDocument();
  expect(
    within(reconstructionSection as HTMLElement).getByText(
      "Radio Chief Soren Pike",
    ),
  ).toBeInTheDocument();
  expect(
    within(reconstructionSection as HTMLElement).getByText(
      "Smuggling protection",
    ),
  ).toBeInTheDocument();
  expect(
    within(reconstructionSection as HTMLElement).getByText(
      "Electrocution in the signal room",
    ),
  ).toBeInTheDocument();
  expect(
    within(attemptHistorySection as HTMLElement).getAllByText("In Progress"),
  ).toHaveLength(2);
  expect(
    within(attemptHistorySection as HTMLElement).getByText("Closed Unsolved"),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/red harbor is closed without a prosecutable case/i),
  ).toBeInTheDocument();
});
