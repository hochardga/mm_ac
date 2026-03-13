import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";

import { NonCaseShell } from "@/components/non-case-shell";
import { authOptions } from "@/lib/auth";

export default async function ShellLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const [session, cookieStore] = await Promise.all([
    getServerSession(authOptions),
    cookies(),
  ]);
  const hasSessionIdentity = Boolean(
    session?.user && "id" in session.user && session.user.id,
  );
  const hasIntakeIdentity = Boolean(cookieStore.get("ashfall-agent-id")?.value);
  const isSignedIn = hasSessionIdentity || hasIntakeIdentity;

  return <NonCaseShell isSignedIn={isSignedIn}>{children}</NonCaseShell>;
}
