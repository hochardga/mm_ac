import { and, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { CaseReturnHeader } from "@/components/case-return-header";
import { caseDefinitions, playerCases } from "@/db/schema";
import { DebriefAttemptHistory } from "@/features/debrief/components/debrief-attempt-history";
import { DebriefReportCard } from "@/features/debrief/components/debrief-report-card";
import { getDebrief } from "@/features/debrief/get-debrief";
import { authOptions } from "@/lib/auth";
import { getDb } from "@/lib/db";

type DebriefPageProps = {
  params: Promise<{
    caseSlug: string;
  }>;
};

export default async function DebriefPage({ params }: DebriefPageProps) {
  const [{ caseSlug }, session, cookieStore] = await Promise.all([
    params,
    getServerSession(authOptions),
    cookies(),
  ]);
  const sessionUserId =
    session?.user && "id" in session.user ? String(session.user.id) : undefined;
  const userId = sessionUserId ?? cookieStore.get("ashfall-agent-id")?.value;

  if (!userId) {
    redirect("/apply");
  }

  const db = await getDb();
  const caseDefinition = await db.query.caseDefinitions.findFirst({
    where: eq(caseDefinitions.slug, caseSlug),
  });

  if (!caseDefinition) {
    notFound();
  }

  const playerCase = await db.query.playerCases.findFirst({
    where: and(
      eq(playerCases.userId, userId),
      eq(playerCases.caseDefinitionId, caseDefinition.id),
    ),
  });

  if (!playerCase) {
    notFound();
  }

  const debrief = await getDebrief({
    playerCaseId: playerCase.id,
  });
  const outcomeLabel =
    debrief.status === "completed" ? "Case solved" : "Case closed unresolved";
  const outcomeDescription =
    debrief.status === "completed"
      ? "Ashfall accepted your filed theory. The final dossier below preserves what you submitted and how the collective reconstructed the case."
      : "Ashfall closed the file after the final attempt. The recap below compares your last submitted theory against the collective's final reconstruction.";

  return (
    <main className="min-h-screen bg-stone-950 px-6 py-16 text-stone-50">
      <div className="mx-auto max-w-5xl space-y-8">
        <CaseReturnHeader
          eyebrow="Case Debrief"
          summary={debrief.summary}
          title={debrief.title}
        />

        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#f0b48f]">
                Outcome
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-stone-50">
                {outcomeLabel}
              </h2>
            </div>
            <p className="rounded-full border border-white/10 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-300">
              {debrief.attempts.length} attempts filed
            </p>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-stone-300">
            {outcomeDescription}
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {debrief.finalReport ? (
            <DebriefReportCard
              title="Your Final Report"
              description="The final theory you filed before Ashfall closed the line."
              eyebrow={`Attempt ${debrief.finalReport.attemptNumber}`}
              selection={{
                suspect: debrief.finalReport.suspect,
                motive: debrief.finalReport.motive,
                method: debrief.finalReport.method,
              }}
            />
          ) : null}

          <DebriefReportCard
            title="Ashfall Reconstruction"
            description="The collective's terminal reconstruction of the case."
            eyebrow={
              debrief.status === "completed"
                ? "Accepted theory"
                : "Corrected theory"
            }
            selection={debrief.solution}
          />
        </section>

        {debrief.attempts.length > 0 ? (
          <DebriefAttemptHistory attempts={debrief.attempts} />
        ) : null}
      </div>
    </main>
  );
}
