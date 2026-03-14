import { getServerSession } from "next-auth";
import Link from "next/link";
import { cookies } from "next/headers";

import { formatCaseContinuityTimestamp } from "@/features/cases/case-continuity";
import { listAvailableCases } from "@/features/cases/list-available-cases";
import { authOptions } from "@/lib/auth";

function formatComplexityLabel(complexity: "light" | "standard" | "deep") {
  switch (complexity) {
    case "light":
      return "Light";
    case "standard":
      return "Standard";
    case "deep":
      return "Deep";
  }
}

export default async function VaultPage() {
  const [session, cookieStore] = await Promise.all([
    getServerSession(authOptions),
    cookies(),
  ]);
  const sessionUserId =
    session?.user && "id" in session.user ? String(session.user.id) : undefined;
  const dossiers = await listAvailableCases({
    userId: sessionUserId ?? cookieStore.get("ashfall-agent-id")?.value,
  });

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#120d0b_0%,_#241916_45%,_#f4ede4_45%,_#f4ede4_100%)] px-6 py-16 text-stone-950">
      <section className="mx-auto max-w-6xl rounded-[2rem] border border-white/10 bg-stone-950/95 px-8 py-10 text-stone-50 shadow-2xl shadow-black/30">
        <p className="text-sm uppercase tracking-[0.3em] text-[#d96c3d]">
          Ashfall Collective / dossier vault
        </p>
        <h1 className="mt-4 text-4xl font-semibold">Dossier Vault</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-300">
          Three active investigations are cleared for field review. Choose your
          next file, preserve your notes, and report back before your handler
          closes the line.
        </p>
      </section>

      <section className="mx-auto mt-10 grid max-w-6xl gap-6 md:grid-cols-2 xl:grid-cols-3">
        {dossiers.map((dossier) => (
          <article
            key={dossier.slug}
            className="flex h-full flex-col rounded-[2rem] border border-stone-200 bg-white p-6 shadow-lg shadow-stone-950/5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.25em] text-stone-500">
                  {dossier.availability === "Available"
                    ? dossier.displayStatus
                    : dossier.availability}
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-stone-950">
                  {dossier.title}
                </h2>
              </div>
              {dossier.availability === "Available" ? (
                <div className="rounded-full border border-stone-300 px-3 py-1 text-xs uppercase tracking-[0.2em] text-stone-600">
                  {formatComplexityLabel(dossier.complexity)}
                </div>
              ) : null}
            </div>

            <p className="mt-4 flex-1 text-base leading-7 text-stone-700">
              {dossier.summary}
            </p>

            {dossier.progressSnapshot ? (
              <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-stone-50 px-4 py-4">
                <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                  Stage {dossier.progressSnapshot.focusStage.position} of{" "}
                  {dossier.progressSnapshot.totalStageCount}
                </p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.16em] text-stone-900">
                  {dossier.progressSnapshot.focusStage.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-stone-700">
                  {dossier.progressSnapshot.solvedObjectiveCount} of{" "}
                  {dossier.progressSnapshot.totalObjectiveCount} objectives solved
                </p>
                <p className="mt-1 text-sm leading-6 text-stone-700">
                  {dossier.progressSnapshot.visibleEvidenceCount} evidence items unlocked
                </p>
                {dossier.progressSnapshot.nextObjectivePrompt ? (
                  <p className="mt-2 text-sm leading-6 text-stone-700">
                    {dossier.progressSnapshot.nextObjectivePrompt}
                  </p>
                ) : null}
              </div>
            ) : null}

            {dossier.availability === "Available" ? (
              <>
                {dossier.continuity ? (
                  <div className="mt-6 rounded-[1.5rem] border border-stone-200 bg-stone-50 px-4 py-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
                      Continuity
                    </p>
                    <p className="mt-2 text-sm leading-6 text-stone-700">
                      {dossier.continuity.description}
                    </p>
                    {dossier.continuity.lastActivityAt ? (
                      <p className="mt-2 text-xs uppercase tracking-[0.18em] text-stone-500">
                        Last activity{" "}
                        {formatCaseContinuityTimestamp(
                          dossier.continuity.lastActivityAt,
                        )}
                      </p>
                    ) : null}
                  </div>
                ) : null}
                <Link
                  className="mt-6 inline-flex w-fit rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-50"
                  href={dossier.continuity?.href ?? `/cases/${dossier.slug}`}
                >
                  {dossier.continuity?.label ?? "Open Case File"}
                </Link>
              </>
            ) : (
              <button
                className="mt-6 inline-flex w-fit cursor-not-allowed rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-500"
                disabled
                type="button"
              >
                Unavailable
              </button>
            )}
          </article>
        ))}
      </section>
    </main>
  );
}
