"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { SiteNavigation } from "@/components/site-navigation";

type NonCaseShellProps = {
  children: ReactNode;
  isSignedIn: boolean;
};

export function NonCaseShell({ children, isSignedIn }: NonCaseShellProps) {
  const pathname = usePathname() ?? "/";

  return (
    <div className="min-h-screen bg-stone-100 text-stone-950">
      <SiteNavigation currentPath={pathname} isSignedIn={isSignedIn} />
      {children}
    </div>
  );
}
