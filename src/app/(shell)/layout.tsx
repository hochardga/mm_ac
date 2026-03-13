import type { ReactNode } from "react";
import { getServerSession } from "next-auth";

import { NonCaseShell } from "@/components/non-case-shell";
import { authOptions } from "@/lib/auth";

export default async function ShellLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const session = await getServerSession(authOptions);
  const isSignedIn = Boolean(session?.user && "id" in session.user && session.user.id);

  return <NonCaseShell isSignedIn={isSignedIn}>{children}</NonCaseShell>;
}
