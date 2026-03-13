import Link from "next/link";

export default function HomePage() {
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
          <Link
            href="/signin"
            className="inline-flex w-fit rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-700"
          >
            Returning Agent Sign In
          </Link>
          <Link
            href="/vault"
            className="inline-flex w-fit rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-700"
          >
            Open Vault
          </Link>
        </div>
      </div>
    </main>
  );
}
