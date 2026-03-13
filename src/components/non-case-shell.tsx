"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { SiteNavigation } from "@/components/site-navigation";

type NonCaseShellProps = {
  children: ReactNode;
};

export function NonCaseShell({ children }: NonCaseShellProps) {
  const pathname = usePathname() ?? "/";

  return (
    <div className="min-h-screen bg-stone-100 text-stone-950">
      <SiteNavigation currentPath={pathname} />
      <main>{children}</main>
    </div>
  );
}
