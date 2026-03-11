"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function SignInPage() {
  const [error, setError] = useState<string | null>(null);

  return (
    <main className="min-h-screen bg-stone-950 px-6 py-16 text-stone-50">
      <div className="mx-auto max-w-xl rounded-3xl border border-white/10 bg-white/5 p-8">
        <h1 className="text-3xl font-semibold">Return to Ashfall</h1>
        <p className="mt-3 text-stone-300">
          Sign back in to continue your current investigation.
        </p>
        <form
          className="mt-8 grid gap-4"
          onSubmit={async (event) => {
            event.preventDefault();

            const form = new FormData(event.currentTarget);
            const email = String(form.get("email") ?? "");
            const password = String(form.get("password") ?? "");
            const result = await signIn("credentials", {
              email,
              password,
              callbackUrl: "/vault",
              redirect: false,
            });

            if (result?.error) {
              setError("Credentials rejected by Ashfall intake.");
              return;
            }

            window.location.assign(result?.url ?? "/vault");
          }}
        >
          <input
            className="rounded-full border border-white/20 bg-black/20 px-4 py-3"
            name="email"
            type="email"
            placeholder="agent@ashfall.local"
            required
          />
          <input
            className="rounded-full border border-white/20 bg-black/20 px-4 py-3"
            name="password"
            type="password"
            placeholder="Clearance phrase"
            required
          />
          {error ? <p className="text-sm text-red-300">{error}</p> : null}
          <button
            className="rounded-full bg-[#d96c3d] px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black"
            type="submit"
          >
            Report In
          </button>
        </form>
      </div>
    </main>
  );
}
