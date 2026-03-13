import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { SiteNavigation } from "@/components/site-navigation";

test("renders the Ashfall brand plus apply, sign in, and vault links", () => {
  render(<SiteNavigation currentPath="/" />);

  expect(
    screen.getByRole("link", { name: /ashfall collective/i }),
  ).toHaveAttribute("href", "/");
  expect(
    screen.getByRole("link", { name: /ashfall collective/i }),
  ).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: /^apply$/i })).toHaveAttribute(
    "href",
    "/apply",
  );
  expect(screen.getByRole("link", { name: /sign in/i })).toHaveAttribute(
    "href",
    "/signin",
  );
  expect(screen.getByRole("link", { name: /vault/i })).toHaveAttribute(
    "href",
    "/vault",
  );
});

test("marks the current route with aria-current", () => {
  render(<SiteNavigation currentPath="/vault" />);

  expect(screen.getByRole("link", { name: /vault/i })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(
    screen.getByRole("link", { name: /ashfall collective/i }),
  ).not.toHaveAttribute("aria-current");
  expect(screen.getByRole("link", { name: /apply/i })).not.toHaveAttribute(
    "aria-current",
  );
  expect(screen.getByRole("link", { name: /sign in/i })).not.toHaveAttribute(
    "aria-current",
  );
});
