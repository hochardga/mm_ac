import { getServerSession } from "next-auth";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";

import { loadCaseManifest } from "@/features/cases/load-case-manifest";
import { openCase } from "@/features/cases/open-case";
import { authOptions } from "@/lib/auth";

type CasePageProps = {
  params: Promise<{
    caseSlug: string;
  }>;
};

export default async function CasePage({ params }: CasePageProps) {
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

  try {
    const [manifest, lifecycle] = await Promise.all([
      loadCaseManifest(caseSlug),
      openCase({ userId, caseSlug }),
    ]);

    return (
      <main className="min-h-screen bg-stone-950 px-6 py-16 text-stone-50">
        <div className="mx-auto max-w-5xl space-y-10">
          <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
            <p className="text-sm uppercase tracking-[0.3em] text-[#d96c3d]">
              Handler channel / {lifecycle.playerCase.caseRevision}
            </p>
            <h1 className="mt-4 text-4xl font-semibold">{manifest.title}</h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">
              {manifest.summary}
            </p>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-semibold">Evidence Intake</h2>
              <div className="mt-6 grid gap-4">
                {manifest.evidence.map((item) => (
                  <article
                    key={item.id}
                    className="rounded-3xl border border-white/10 bg-black/20 p-5"
                  >
                    <p className="text-xs uppercase tracking-[0.25em] text-[#d96c3d]">
                      {item.kind}
                    </p>
                    <h3 className="mt-3 text-xl font-medium">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-stone-300">
                      {item.content}
                    </p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
              <h2 className="text-2xl font-semibold">Handler Directives</h2>
              <ul className="mt-6 space-y-4 text-sm leading-7 text-stone-300">
                {manifest.handlerPrompts.map((prompt) => (
                  <li key={prompt}>{prompt}</li>
                ))}
              </ul>
            </aside>
          </section>
        </div>
      </main>
    );
  } catch {
    notFound();
  }
}
