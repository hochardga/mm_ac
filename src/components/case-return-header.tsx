import Link from "next/link";

type CaseReturnHeaderProps = {
  eyebrow: string;
  title: string;
  summary: string;
};

export function CaseReturnHeader({
  eyebrow,
  title,
  summary,
}: CaseReturnHeaderProps) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
      <div className="flex flex-wrap items-center gap-3 text-sm uppercase tracking-[0.2em] text-stone-300">
        <Link
          className="rounded-full border border-white/15 px-3 py-1 text-xs font-semibold tracking-[0.2em] text-stone-100"
          href="/vault"
        >
          Back to Vault
        </Link>
        <Link
          className="text-stone-400 transition hover:text-stone-100"
          href="/"
        >
          Home
        </Link>
      </div>
      <p className="mt-6 text-sm uppercase tracking-[0.3em] text-[#d96c3d]">
        {eyebrow}
      </p>
      <h1 className="mt-4 text-4xl font-semibold">{title}</h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">
        {summary}
      </p>
    </section>
  );
}
