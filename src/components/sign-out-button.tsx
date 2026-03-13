"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    await signOut({ callbackUrl: "/" });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="inline-flex rounded-full border border-stone-300 bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700 transition hover:border-stone-400 hover:text-stone-950 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Signing Out..." : "Sign Out"}
    </button>
  );
}
