import type { ReactNode } from "react";
import { getServerSession } from "next-auth";
import { cookies } from "next/headers";

import { NonCaseShell } from "@/components/non-case-shell";
import { hasIdentity } from "@/features/auth/has-identity";
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
  const isSignedIn = hasIdentity(session, cookieStore);

  return <NonCaseShell isSignedIn={isSignedIn}>{children}</NonCaseShell>;
}
