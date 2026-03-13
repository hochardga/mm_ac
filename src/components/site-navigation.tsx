import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";

type SiteNavigationProps = {
  currentPath: string;
  isSignedIn: boolean;
};

const pillBaseClasses =
  "inline-flex rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition";
const pillActiveClasses = "border-stone-950 bg-stone-950 text-stone-50";
const pillInactiveClasses =
  "border-stone-300 bg-transparent text-stone-700 hover:border-stone-400 hover:text-stone-950";

const signedOutLinks = [
  { href: "/apply", label: "Apply" },
  { href: "/signin", label: "Sign In" },
];

const signedInLinks = [
  { href: "/apply", label: "Apply" },
  { href: "/vault", label: "Vault" },
];

export function SiteNavigation({ currentPath, isSignedIn }: SiteNavigationProps) {
  const links = isSignedIn ? signedInLinks : signedOutLinks;

  return (
    <header className="border-b border-stone-300 bg-stone-100/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <Link
          href="/"
          aria-current={currentPath === "/" ? "page" : undefined}
          className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-700"
        >
          Ashfall Collective
        </Link>

        <div className="flex items-center gap-2">
          <nav aria-label="Primary" className="flex items-center gap-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={currentPath === link.href ? "page" : undefined}
                className={[
                  pillBaseClasses,
                  currentPath === link.href ? pillActiveClasses : pillInactiveClasses,
                ].join(" ")}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          {isSignedIn ? <SignOutButton /> : null}
        </div>
      </div>
    </header>
  );
}
