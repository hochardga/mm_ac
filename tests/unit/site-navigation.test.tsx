import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { SiteNavigation } from "@/components/site-navigation";

test("signed-out nav shows apply and sign in but hides vault controls", () => {
  render(<SiteNavigation currentPath="/apply" isSignedIn={false} />);

  expect(
    screen.getByRole("link", { name: /ashfall collective/i }),
  ).toHaveAttribute("href", "/");
  expect(screen.getByRole("link", { name: /^apply$/i })).toHaveAttribute(
    "href",
    "/apply",
  );
  expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
    "href",
    "/signin",
  );
  expect(screen.queryByRole("link", { name: /vault/i })).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /sign out/i }),
  ).not.toBeInTheDocument();
});

test("signed-in nav shows vault and sign out while hiding sign in", () => {
  render(<SiteNavigation currentPath="/vault" isSignedIn />);

  expect(screen.getByRole("link", { name: /vault/i })).toHaveAttribute(
    "href",
    "/vault",
  );
  expect(screen.getByRole("link", { name: /vault/i })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(
    screen.getByRole("button", { name: /sign out/i }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("link", { name: /sign in/i }),
  ).not.toBeInTheDocument();
});

test("shell nav uses styled header and brand treatments", () => {
  render(<SiteNavigation currentPath="/apply" isSignedIn={false} />);

  expect(screen.getByRole("banner")).toHaveClass("border-b");
  expect(screen.getByRole("banner")).toHaveClass("bg-stone-100/95");
  expect(
    screen.getByRole("link", { name: /ashfall collective/i }),
  ).toHaveClass("tracking-[0.3em]");
});
