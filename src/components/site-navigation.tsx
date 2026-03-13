import Link from "next/link";

const links = [
  { href: "/apply", label: "Apply" },
  { href: "/signin", label: "Sign In" },
  { href: "/vault", label: "Vault" },
];

export function SiteNavigation({ currentPath }: { currentPath: string }) {
  return (
    <header>
      <Link href="/" aria-current={currentPath === "/" ? "page" : undefined}>
        Ashfall Collective
      </Link>
      <nav aria-label="Primary">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            aria-current={currentPath === link.href ? "page" : undefined}
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
