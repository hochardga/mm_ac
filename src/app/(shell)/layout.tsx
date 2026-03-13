import type { ReactNode } from "react";

import { NonCaseShell } from "@/components/non-case-shell";

export default function ShellLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return <NonCaseShell>{children}</NonCaseShell>;
}
