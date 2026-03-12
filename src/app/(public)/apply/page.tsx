import { ApplyForm } from "@/app/(public)/apply/apply-form";

export default function ApplyPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(217,108,61,0.18),_transparent_24%),linear-gradient(180deg,_#f7efe4_0%,_#efe2d2_100%)] px-6 py-16 text-stone-900">
      <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <p className="text-sm uppercase tracking-[0.3em] text-stone-600">
            Ashfall Collective / recruit intake
          </p>
          <h1 className="max-w-xl text-5xl font-semibold leading-tight">
            Apply for field status inside the Ashfall Collective.
          </h1>
          <p className="max-w-xl text-lg leading-8 text-stone-700">
            Three active investigations are waiting in the dossier vault. File
            your application, accept your handler&apos;s terms, and report for
            first assignment.
          </p>
        </section>

        <ApplyForm />
      </div>
    </main>
  );
}
