import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { notes, reportDrafts } from "@/db/schema";
import { CaseWorkspace } from "@/features/cases/components/case-workspace";
import { loadCaseManifest } from "@/features/cases/load-case-manifest";
import { openCase } from "@/features/cases/open-case";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

type CasePageProps = {
  params: Promise<{
    caseSlug: string;
  }>;
};

type CaseSearchParams = {
  evidence?: string;
};

export default async function CasePage({
  params,
  searchParams,
}: CasePageProps & {
  searchParams?: Promise<CaseSearchParams>;
}) {
  const [{ caseSlug }, session, cookieStore, resolvedSearchParams] =
    await Promise.all([
    params,
    getServerSession(authOptions),
    cookies(),
    searchParams ?? Promise.resolve<CaseSearchParams>({}),
    ]);
  const sessionUserId =
    session?.user && "id" in session.user ? String(session.user.id) : undefined;
  const userId = sessionUserId ?? cookieStore.get("ashfall-agent-id")?.value;

  if (!userId) {
    redirect("/apply");
  }

  try {
    const [manifest, lifecycle] = await Promise.all([
      loadCaseManifest(caseSlug),
      openCase({ userId, caseSlug }),
    ]);
    const db = await getDb();
    const [savedNote, savedDraft] = await Promise.all([
      db.query.notes.findFirst({
        where: eq(notes.playerCaseId, lifecycle.playerCase.id),
      }),
      db.query.reportDrafts.findFirst({
        where: eq(reportDrafts.playerCaseId, lifecycle.playerCase.id),
      }),
    ]);
    const submissionToken = randomUUID();

    return (
      <main className="min-h-screen bg-stone-950 px-6 py-16 text-stone-50">
        <div className="mx-auto max-w-7xl space-y-10">
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-[#d96c3d]">
              Handler channel / {lifecycle.playerCase.caseRevision}
            </p>
            <h1 className="mt-4 text-4xl font-semibold">{manifest.title}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">
              {manifest.summary}
            </p>
          </section>

          <CaseWorkspace
            caseSlug={caseSlug}
            manifest={manifest}
            playerCaseId={lifecycle.playerCase.id}
            savedDraft={savedDraft}
            savedNote={savedNote}
            selectedEvidenceId={resolvedSearchParams.evidence}
            submissionToken={submissionToken}
          />
        </div>
      </main>
    );
  } catch {
    notFound();
  }
}
