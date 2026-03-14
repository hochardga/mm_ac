import { randomUUID } from "node:crypto";

import { desc, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { notes, reportDrafts, reportSubmissions, users } from "@/db/schema";
import { CaseReturnHeader } from "@/components/case-return-header";
import { CaseWorkspace } from "@/features/cases/components/case-workspace";
import { loadCaseManifest } from "@/features/cases/load-case-manifest";
import { openCase } from "@/features/cases/open-case";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

type CasePageProps = {
  params: Promise<{
    caseSlug: string;
  }>;
  searchParams?: Promise<CaseSearchParams>;
};

type CaseSearchParams = {
  evidence?: string | string[];
};

async function resolveStoredAgentId(input: {
  sessionUserId?: string;
  intakeUserId?: string;
}) {
  const db = await getDb();

  if (input.sessionUserId) {
    const sessionUser = await db.query.users.findFirst({
      where: eq(users.id, input.sessionUserId),
    });

    if (sessionUser) {
      return sessionUser.id;
    }
  }

  if (input.intakeUserId && input.intakeUserId !== input.sessionUserId) {
    const intakeUser = await db.query.users.findFirst({
      where: eq(users.id, input.intakeUserId),
    });

    if (intakeUser) {
      return intakeUser.id;
    }
  }

  return undefined;
}

export default async function CasePage({
  params,
  searchParams,
}: CasePageProps) {
  const [{ caseSlug }, session, cookieStore, resolvedSearchParams] =
    await Promise.all([
      params,
      getServerSession(authOptions),
      cookies(),
      searchParams ?? Promise.resolve<CaseSearchParams>({}),
    ]);
  const selectedEvidenceIds = Array.isArray(resolvedSearchParams.evidence)
    ? resolvedSearchParams.evidence
    : resolvedSearchParams.evidence
      ? [resolvedSearchParams.evidence]
      : [];
  const sessionUserId =
    session?.user && "id" in session.user ? String(session.user.id) : undefined;
  const intakeUserId = cookieStore.get("ashfall-agent-id")?.value;
  const userId = await resolveStoredAgentId({
    sessionUserId,
    intakeUserId,
  });

  if (!userId) {
    redirect("/apply");
  }

  try {
    const [manifest, lifecycle] = await Promise.all([
      loadCaseManifest(caseSlug),
      openCase({ userId, caseSlug }),
    ]);
    const db = await getDb();
    const [savedNote, savedDraft, latestSubmission] = await Promise.all([
      db.query.notes.findFirst({
        where: eq(notes.playerCaseId, lifecycle.playerCase.id),
      }),
      db.query.reportDrafts.findFirst({
        where: eq(reportDrafts.playerCaseId, lifecycle.playerCase.id),
      }),
      db.query.reportSubmissions.findFirst({
        where: eq(reportSubmissions.playerCaseId, lifecycle.playerCase.id),
        orderBy: [desc(reportSubmissions.attemptNumber)],
      }),
    ]);
    const submissionToken = randomUUID();

    return (
      <main className="min-h-screen bg-stone-950 px-6 py-16 text-stone-50">
        <div className="mx-auto max-w-5xl space-y-10">
          <CaseReturnHeader
            eyebrow={`Handler channel / ${lifecycle.playerCase.caseRevision}`}
            summary={manifest.summary}
            title={manifest.title}
          />

        <CaseWorkspace
          caseSlug={caseSlug}
          manifest={manifest}
          playerCaseId={lifecycle.playerCase.id}
          latestSubmission={latestSubmission}
          resumeTarget={lifecycle.resumeTarget}
          savedDraft={savedDraft}
          savedNote={savedNote}
          selectedEvidenceId={selectedEvidenceIds[0]}
            submissionToken={submissionToken}
          />
        </div>
      </main>
    );
  } catch {
    notFound();
  }
}
