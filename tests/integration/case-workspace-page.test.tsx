import { randomUUID } from "node:crypto";

import { render, screen } from "@testing-library/react";
import { afterEach, test, vi } from "vitest";

const { cookiesMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
}));
const { getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

import CasePage from "@/app/(app)/cases/[caseSlug]/page";
import { users } from "@/db/schema";
import { ReportPanel } from "@/features/cases/components/report-panel";
import { loadCaseManifest } from "@/features/cases/load-case-manifest";
import { closeDb, getDb } from "@/lib/db";

afterEach(async () => {
  cookiesMock.mockReset();
  getServerSessionMock.mockReset();
  await closeDb();
});

test("renders an evidence index, selected viewer, and persistent notes together", async () => {
  const db = await getDb();
  const userId = randomUUID();

  await db.insert(users).values({
    id: userId,
    email: "agent@example.com",
    passwordHash: "hashed-password",
    alias: "Agent Ash",
  });

  getServerSessionMock.mockResolvedValue({
    user: {
      id: userId,
    },
  });
  cookiesMock.mockResolvedValue({
    get: () => undefined,
  });

  render(
    await CasePage({
      params: Promise.resolve({ caseSlug: "hollow-bishop" }),
      searchParams: Promise.resolve({ evidence: "vestry-interview" }),
    } as never),
  );

  expect(
    screen.getByRole("heading", { name: /evidence intake/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /field notes/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("heading", { name: /draft report/i }),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/the silver chalice was on the floor beside the desk/i),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/active evidence: vestry interview transcript/i),
  ).toBeInTheDocument();
});

test("preserves the selected evidence when saving a draft", async () => {
  const manifest = await loadCaseManifest("red-harbor");

  render(
    <ReportPanel
      caseSlug="red-harbor"
      playerCaseId="player-case-1"
      selectedEvidenceId="dispatch-log"
      manifest={manifest}
      savedDraft={undefined}
      submissionToken="submission-token"
    />,
  );

  expect(screen.getByDisplayValue("dispatch-log")).toBeInTheDocument();
});
