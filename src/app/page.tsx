import Link from "next/link";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";

import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const [session, cookieStore] = await Promise.all([
    getServerSession(authOptions),
    cookies(),
  ]);
  const hasSessionIdentity = Boolean(
    session?.user && "id" in session.user && session.user.id,
  );
  const hasIntakeIdentity = Boolean(cookieStore.get("ashfall-agent-id")?.value);
  const isSignedIn = hasSessionIdentity || hasIntakeIdentity;

  return (
    <main className="px-6 py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-[2rem] border border-stone-300 bg-white p-10 shadow-sm">
        <h1 className="text-4xl font-semibold tracking-tight text-stone-950">
          Ashfall Collective
        </h1>
        <p className="max-w-2xl text-lg text-stone-700">
          Report to your handler. First cases incoming.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/apply"
            className="inline-flex w-fit rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-50"
          >
            Apply for Field Status
          </Link>
          {isSignedIn ? (
            <Link
              href="/vault"
              className="inline-flex w-fit rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-700"
            >
              Open Vault
            </Link>
          ) : (
            <Link
              href="/signin"
              className="inline-flex w-fit rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-700"
            >
              Returning Agent Sign In
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
