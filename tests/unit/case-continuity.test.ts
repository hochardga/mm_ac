import { describe, expect, test } from "vitest";

import { buildCaseContinuity } from "@/features/cases/case-continuity";

describe("buildCaseContinuity", () => {
  test("returns a report resume target when a saved draft exists", () => {
    const continuity = buildCaseContinuity({
      caseSlug: "hollow-bishop",
      status: "in_progress",
      note: undefined,
      draft: {
        suspectId: "bookkeeper",
        motiveId: "embezzlement",
        methodId: "poisoned-wine",
        attemptCount: 1,
        updatedAt: new Date("2026-03-13T18:00:00.000Z"),
      },
      latestSubmission: undefined,
      playerCaseUpdatedAt: new Date("2026-03-13T17:00:00.000Z"),
    });

    expect(continuity.section).toBe("report");
    expect(continuity.label).toMatch(/resume report/i);
    expect(continuity.href).toBe("/cases/hollow-bishop#draft-report");
    expect(continuity.lastActivityAt?.toISOString()).toBe(
      "2026-03-13T18:00:00.000Z",
    );
  });

  test("returns a notes resume target when notes exist without a draft", () => {
    const continuity = buildCaseContinuity({
      caseSlug: "red-harbor",
      status: "in_progress",
      note: {
        body: "Recheck the harbor log.",
        updatedAt: new Date("2026-03-13T19:00:00.000Z"),
      },
      draft: undefined,
      latestSubmission: undefined,
      playerCaseUpdatedAt: new Date("2026-03-13T17:00:00.000Z"),
    });

    expect(continuity.section).toBe("notes");
    expect(continuity.label).toMatch(/resume notes/i);
    expect(continuity.href).toBe("/cases/red-harbor#field-notes");
  });

  test("returns an objectives resume target when staged objective drafts exist", () => {
    const continuity = buildCaseContinuity({
      caseSlug: "staged-harbor",
      status: "in_progress",
      note: undefined,
      draft: undefined,
      latestSubmission: undefined,
      objectiveStates: [
        {
          objectiveId: "trace-ledger",
          stageId: "briefing",
          status: "active",
          draftPayload: {
            type: "single_choice",
            choiceId: "dockmaster",
          },
        },
      ],
      objectiveSubmissions: [],
      playerCaseUpdatedAt: new Date("2026-03-13T20:00:00.000Z"),
    });

    expect(continuity.section).toBe("objectives");
    expect(continuity.label).toMatch(/resume objectives/i);
    expect(continuity.href).toBe("/cases/staged-harbor#active-objectives");
  });

  test("returns an objectives resume target when staged feedback is present", () => {
    const continuity = buildCaseContinuity({
      caseSlug: "staged-harbor",
      status: "in_progress",
      note: undefined,
      draft: undefined,
      latestSubmission: undefined,
      objectiveStates: [
        {
          objectiveId: "trace-ledger",
          stageId: "briefing",
          status: "active",
          draftPayload: null,
        },
      ],
      objectiveSubmissions: [
        {
          objectiveId: "trace-ledger",
          nextStatus: "in_progress",
          feedback: "Not enough corroboration.",
          createdAt: new Date("2026-03-13T20:30:00.000Z"),
        },
      ],
      playerCaseUpdatedAt: new Date("2026-03-13T20:00:00.000Z"),
    });

    expect(continuity.section).toBe("objectives");
    expect(continuity.label).toMatch(/resume objectives/i);
    expect(continuity.href).toBe("/cases/staged-harbor#active-objectives");
  });

  test("falls back to evidence when an in-progress case has no saved work", () => {
    const continuity = buildCaseContinuity({
      caseSlug: "red-harbor",
      status: "in_progress",
      note: undefined,
      draft: undefined,
      latestSubmission: undefined,
      playerCaseUpdatedAt: new Date("2026-03-13T17:00:00.000Z"),
    });

    expect(continuity.section).toBe("evidence");
    expect(continuity.label).toMatch(/return to evidence/i);
    expect(continuity.href).toBe("/cases/red-harbor#evidence-intake");
  });

  test("prefers the debrief destination for completed cases", () => {
    const continuity = buildCaseContinuity({
      caseSlug: "briar-ledger",
      status: "completed",
      note: undefined,
      draft: undefined,
      latestSubmission: undefined,
      playerCaseUpdatedAt: new Date("2026-03-13T17:00:00.000Z"),
    });

    expect(continuity.section).toBe("debrief");
    expect(continuity.label).toMatch(/review debrief/i);
    expect(continuity.href).toBe("/cases/briar-ledger/debrief");
  });

  test("prefers the debrief destination for closed unsolved cases", () => {
    const continuity = buildCaseContinuity({
      caseSlug: "briar-ledger",
      status: "closed_unsolved",
      note: undefined,
      draft: undefined,
      latestSubmission: undefined,
      playerCaseUpdatedAt: new Date("2026-03-13T17:00:00.000Z"),
    });

    expect(continuity.section).toBe("debrief");
    expect(continuity.label).toMatch(/review debrief/i);
    expect(continuity.href).toBe("/cases/briar-ledger/debrief");
  });
});
