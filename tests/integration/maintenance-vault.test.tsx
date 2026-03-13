import { randomUUID } from "node:crypto";

import { render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

const { cookiesMock } = vi.hoisted(() => ({
  cookiesMock: vi.fn(),
}));
const { getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
}));
const { syncCaseDefinitionsMock } = vi.hoisted(() => ({
  syncCaseDefinitionsMock: vi.fn(),
}));
const { loadCaseManifestMock } = vi.hoisted(() => ({
  loadCaseManifestMock: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: cookiesMock,
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

vi.mock("@/features/cases/sync-case-definitions", () => ({
  syncCaseDefinitions: syncCaseDefinitionsMock,
}));

vi.mock("@/features/cases/load-case-manifest", () => ({
  loadCaseManifest: loadCaseManifestMock,
}));

import VaultPage from "@/app/(shell)/vault/page";
import { caseDefinitions } from "@/db/schema";
import { closeDb, getDb } from "@/lib/db";

afterEach(async () => {
  cookiesMock.mockReset();
  getServerSessionMock.mockReset();
  syncCaseDefinitionsMock.mockReset();
  loadCaseManifestMock.mockReset();
  await closeDb();
});

test("renders a maintenance state for a broken published case", async () => {
  const db = await getDb();

  getServerSessionMock.mockResolvedValue(null);
  cookiesMock.mockResolvedValue({
    get: () => undefined,
  });
  syncCaseDefinitionsMock.mockResolvedValue(undefined);
  loadCaseManifestMock.mockRejectedValue(new Error("broken manifest"));

  await db.insert(caseDefinitions).values({
    id: randomUUID(),
    slug: "hollow-bishop",
    title: "The Hollow Bishop",
    currentPublishedRevision: "rev-1",
  });

  render(await VaultPage());

  expect(screen.getByText("The Hollow Bishop")).toBeInTheDocument();
  expect(screen.getByText("Maintenance")).toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: /unavailable/i }),
  ).toBeDisabled();
});
