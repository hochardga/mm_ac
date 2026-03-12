import { and, eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { caseDefinitions, playerCases } from "@/db/schema";
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

  return (
    <main className="min-h-screen bg-stone-950 px-6 py-16 text-stone-50">
      <section className="mx-auto max-w-4xl rounded-[2rem] border border-white/10 bg-white/5 p-8">
        <p className="text-sm uppercase tracking-[0.3em] text-[#d96c3d]">
          Case Debrief
        </p>
        <h1 className="mt-4 text-4xl font-semibold">{debrief.title}</h1>
        <p className="mt-4 text-lg leading-8 text-stone-300">
          {debrief.summary}
        </p>
      </section>
    </main>
  );
}
