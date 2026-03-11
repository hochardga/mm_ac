"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";

import {
  registerAgentAction,
  type ApplyActionState,
} from "@/app/(public)/apply/actions";

const initialState: ApplyActionState = {
  status: "idle",
};

export function ApplyForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    registerAgentAction,
    initialState,
  );

  useEffect(() => {
    if (state.status !== "success" || !state.redirectTo) {
      return;
    }

    router.push(state.redirectTo);
  }, [router, state]);

  return (
    <form
      action={formAction}
      className="grid gap-4 rounded-3xl border border-black/10 bg-white/90 p-6 shadow-xl shadow-black/5"
    >
      <label className="grid gap-2">
        <span className="text-sm uppercase tracking-[0.2em] text-stone-600">
          Operative Alias
        </span>
        <input
          className="rounded-full border border-stone-300 px-4 py-3"
          name="alias"
          placeholder="Agent Ash"
          required
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm uppercase tracking-[0.2em] text-stone-600">
          Agency Email
        </span>
        <input
          className="rounded-full border border-stone-300 px-4 py-3"
          name="email"
          type="email"
          placeholder="agent@ashfall.local"
          required
        />
      </label>

      <label className="grid gap-2">
        <span className="text-sm uppercase tracking-[0.2em] text-stone-600">
          Clearance Phrase
        </span>
        <input
          className="rounded-full border border-stone-300 px-4 py-3"
          name="password"
          type="password"
          required
        />
      </label>

      {state.message ? (
        <p className="text-sm text-red-700">{state.message}</p>
      ) : null}

      <button
        className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-50"
        type="submit"
        disabled={pending}
      >
        {pending ? "Processing..." : "Submit Application"}
      </button>
    </form>
  );
}
