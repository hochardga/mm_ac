# Auth-Aware Navigation Follow-Up Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the first-pass navigation shell so the home page is hero-only, shared non-home routes render a styled auth-aware header, signed-in users can sign out, and auth/navigation actions show utilitarian loading feedback.

**Architecture:** Move the root landing page back to `src/app/page.tsx` so it no longer inherits the shared shell. Keep `/apply`, `/signin`, and `/vault` under `src/app/(shell)/layout.tsx`, but make that layout server-rendered so it can read `getServerSession(authOptions)` once and pass a small signed-in flag into a styled navigation component. Add a small client-only sign-out control plus lightweight loading surfaces for shell routes and credential actions.

**Tech Stack:** Next.js App Router, React 19, TypeScript, Tailwind CSS v4, NextAuth, Vitest, Testing Library, Playwright

---

## File Structure

### Create

- `src/app/page.tsx` - Root landing page outside the shared shell, with auth-aware hero actions.
- `src/app/(shell)/loading.tsx` - Lightweight loading UI for shell-owned routes.
- `src/components/sign-out-button.tsx` - Small client-only sign-out control with pending state.
- `tests/unit/home-page.test.tsx` - Unit coverage for the root landing page auth matrix and no-shell behavior.
- `tests/unit/shell-loading.test.tsx` - Unit coverage for the shell route loading surface.
- `tests/unit/sign-out-button.test.tsx` - Unit coverage for sign-out pending state.
- `tests/unit/signin-page.test.tsx` - Unit coverage for sign-in pending and error behavior.

### Modify

- `src/app/(shell)/layout.tsx` - Convert to a server component that reads the session and passes signed-in state into the shell.
- `src/components/non-case-shell.tsx` - Accept auth state and render the styled shared header for non-home routes.
- `src/components/site-navigation.tsx` - Replace the static plain-text nav with a styled auth-aware header.
- `src/app/(shell)/signin/page.tsx` - Add pending UI for credential submission.
- `tests/unit/site-navigation.test.tsx` - Replace static-link tests with auth-aware rendering and styling assertions.
- `tests/unit/app-shell.test.tsx` - Update shell tests so they validate non-home layout ownership instead of a shell-owned home page.
- `tests/integration/non-case-shell-routes.test.tsx` - Cover signed-out and signed-in shell behavior across real route modules.
- `tests/e2e/navigation.spec.ts` - Cover signed-out home behavior, signed-in shell behavior, and sign-out flow.

### Remove

- `src/app/(shell)/page.tsx` - The root route moves back out of the shared shell.

## Chunk 1: Move The Home Route Back Out Of The Shell

### Task 1: Re-establish `/` as a standalone, auth-aware landing page

**Files:**
- Create: `src/app/page.tsx`
- Create: `tests/unit/home-page.test.tsx`
- Modify: `tests/unit/app-shell.test.tsx`
- Remove: `src/app/(shell)/page.tsx`
- Test: `tests/unit/home-page.test.tsx`
- Test: `tests/unit/app-shell.test.tsx`

- [ ] **Step 1: Write the failing tests for the root route and shell boundary**

```tsx
import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const { getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

import HomePage from "@/app/page";

beforeEach(() => {
  getServerSessionMock.mockReset();
});

test("signed-out home page has no primary nav and offers sign in", async () => {
  getServerSessionMock.mockResolvedValue(null);

  render(await HomePage());

  expect(screen.queryByRole("navigation", { name: /primary/i })).toBeNull();
  expect(
    screen.getByRole("link", { name: /apply for field status/i }),
  ).toHaveAttribute("href", "/apply");
  expect(
    screen.getByRole("link", { name: /returning agent sign in/i }),
  ).toHaveAttribute("href", "/signin");
  expect(screen.queryByRole("link", { name: /open vault/i })).toBeNull();
});

test("signed-in home page swaps sign in for open vault", async () => {
  getServerSessionMock.mockResolvedValue({ user: { id: "agent-7" } });

  render(await HomePage());

  expect(screen.queryByRole("navigation", { name: /primary/i })).toBeNull();
  expect(screen.queryByRole("link", { name: /returning agent sign in/i })).toBeNull();
  expect(screen.getByRole("link", { name: /open vault/i })).toHaveAttribute(
    "href",
    "/vault",
  );
});
```

Update `tests/unit/app-shell.test.tsx` so it stops importing `@/app/(shell)/page` and instead verifies that `ShellLayout` wraps generic child content with a primary navigation region. Add a `getServerSession` mock before importing `ShellLayout`:

```tsx
const { getServerSessionMock } = vi.hoisted(() => ({
  getServerSessionMock: vi.fn(),
}));

vi.mock("next-auth", () => ({
  getServerSession: getServerSessionMock,
}));

test("shell layout wraps non-home content with primary navigation", async () => {
  getServerSessionMock.mockResolvedValue(null);

  render(
    await ShellLayout({
      children: <p>Shell child content</p>,
    }),
  );

  expect(screen.getByRole("navigation", { name: /primary/i })).toBeInTheDocument();
  expect(screen.getByText("Shell child content")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run tests/unit/home-page.test.tsx tests/unit/app-shell.test.tsx`

Expected: FAIL because `src/app/page.tsx` does not exist yet, `src/app/(shell)/page.tsx` is still the root route owner, and the shell test still assumes the home page lives inside the shell.

- [ ] **Step 3: Write the minimal root-page implementation and remove the shell-owned home route**

Create `src/app/page.tsx` as an async server component:

```tsx
import { getServerSession } from "next-auth";
import Link from "next/link";

import { authOptions } from "@/lib/auth";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const isSignedIn =
    Boolean(session?.user && "id" in session.user && session.user.id);

  return (
    <main className="px-6 py-16">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-[2rem] border border-stone-300 bg-white p-10 shadow-sm">
        <h1 className="text-4xl font-semibold tracking-tight text-stone-950">
          Ashfall Collective
        </h1>
        <p className="max-w-2xl text-lg text-stone-700">
          Report to your handler. First cases incoming.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/apply"
            className="inline-flex w-fit rounded-full bg-stone-950 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-50"
          >
            Apply for Field Status
          </Link>
          {isSignedIn ? (
            <Link
              href="/vault"
              className="inline-flex w-fit rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-700"
            >
              Open Vault
            </Link>
          ) : (
            <Link
              href="/signin"
              className="inline-flex w-fit rounded-full border border-stone-300 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-stone-700"
            >
              Returning Agent Sign In
            </Link>
          )}
        </div>
      </div>
    </main>
  );
}
```

Delete `src/app/(shell)/page.tsx`.

Keep `src/app/(shell)/layout.tsx` in place for now, but make sure `tests/unit/app-shell.test.tsx` renders generic child content instead of the old home page module.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run tests/unit/home-page.test.tsx tests/unit/app-shell.test.tsx`

Expected: PASS with the root page outside the shell and the shell tests no longer tied to `/`.

- [ ] **Step 5: Commit**

```bash
git add src/app/page.tsx tests/unit/home-page.test.tsx tests/unit/app-shell.test.tsx
git rm 'src/app/(shell)/page.tsx'
git commit -m "refactor: move home route out of the shared shell"
```

## Chunk 2: Make The Shared Shell Auth-Aware And Styled

### Task 2: Convert the shell layout into a server-owned auth boundary

**Files:**
- Modify: `src/app/(shell)/layout.tsx`
- Modify: `src/components/non-case-shell.tsx`
- Modify: `src/components/site-navigation.tsx`
- Modify: `tests/unit/site-navigation.test.tsx`
- Modify: `tests/unit/app-shell.test.tsx`
- Modify: `tests/integration/non-case-shell-routes.test.tsx`
- Test: `tests/unit/site-navigation.test.tsx`
- Test: `tests/unit/app-shell.test.tsx`
- Test: `tests/integration/non-case-shell-routes.test.tsx`

- [ ] **Step 1: Write the failing tests for the signed-in and signed-out navigation matrix**

Update `tests/unit/site-navigation.test.tsx` to cover auth-aware rendering and styling:

```tsx
import { render, screen, within } from "@testing-library/react";
import { expect, test } from "vitest";

import { SiteNavigation } from "@/components/site-navigation";

test("signed-out nav shows apply and sign in, but not vault or sign out", () => {
  render(<SiteNavigation currentPath="/apply" isSignedIn={false} />);

  const navigation = screen.getByRole("navigation", { name: /primary/i });

  expect(within(navigation).getByRole("link", { name: /^apply$/i })).toHaveAttribute(
    "href",
    "/apply",
  );
  expect(within(navigation).getByRole("link", { name: /sign in/i })).toHaveAttribute(
    "href",
    "/signin",
  );
  expect(within(navigation).queryByRole("link", { name: /vault/i })).toBeNull();
  expect(within(navigation).queryByRole("button", { name: /sign out/i })).toBeNull();
});

test("signed-in nav shows vault and sign out, but not sign in", () => {
  render(<SiteNavigation currentPath="/vault" isSignedIn />);

  const navigation = screen.getByRole("navigation", { name: /primary/i });

  expect(within(navigation).getByRole("link", { name: /vault/i })).toHaveAttribute(
    "aria-current",
    "page",
  );
  expect(within(navigation).getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  expect(within(navigation).queryByRole("link", { name: /sign in/i })).toBeNull();
});

test("nav uses shell styling instead of plain text defaults", () => {
  render(<SiteNavigation currentPath="/vault" isSignedIn />);

  const header = screen.getByRole("banner");
  expect(header).toHaveClass("border-b");
  expect(screen.getByRole("link", { name: /ashfall collective/i })).toHaveClass(
    "tracking-[0.3em]",
  );
});
```

Update `tests/unit/app-shell.test.tsx` so it renders `await ShellLayout({ children: <p>Shell child content</p> })` with mocked `getServerSession`, then verifies signed-out layout shows `Sign In` but not `Vault`, and signed-in layout shows `Vault` plus `Sign Out`:

```tsx
test("signed-out shell layout shows sign in but hides vault", async () => {
  getServerSessionMock.mockResolvedValue(null);

  render(await ShellLayout({ children: <p>Shell child content</p> }));

  expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /vault/i })).toBeNull();
});

test("signed-in shell layout shows vault and sign out", async () => {
  getServerSessionMock.mockResolvedValue({ user: { id: "agent-7" } });

  render(await ShellLayout({ children: <p>Shell child content</p> }));

  expect(screen.getByRole("link", { name: /vault/i })).toBeInTheDocument();
  expect(screen.getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  expect(screen.queryByRole("link", { name: /sign in/i })).toBeNull();
});
```

Update `tests/integration/non-case-shell-routes.test.tsx` so it renders `ApplyPage`, `SignInPage`, and `VaultPage` inside `ShellLayout` and asserts:

- signed-out apply route shows `Apply` and `Sign In`, but not `Vault`
- signed-in vault route shows `Vault` and `Sign Out`, but not `Sign In`
- the vault route header carries styling classes such as `border-b` and `bg-stone-100/95`

Use a concrete pattern like:

```tsx
render(
  await ShellLayout({
    children: <ApplyPage />,
  }),
);

expect(screen.getByRole("link", { name: /^apply$/i })).toBeInTheDocument();
expect(screen.getByRole("link", { name: /sign in/i })).toBeInTheDocument();
expect(screen.queryByRole("link", { name: /vault/i })).toBeNull();
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run tests/unit/site-navigation.test.tsx tests/unit/app-shell.test.tsx tests/integration/non-case-shell-routes.test.tsx`

Expected: FAIL because the shell is still static, the layout does not read the session, and the header has no styling or sign-out control.

- [ ] **Step 3: Implement the server-owned shell and styled auth-aware navigation**

Convert `src/app/(shell)/layout.tsx` into an async server component:

```tsx
import type { ReactNode } from "react";
import { getServerSession } from "next-auth";

import { NonCaseShell } from "@/components/non-case-shell";
import { authOptions } from "@/lib/auth";

export default async function ShellLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const session = await getServerSession(authOptions);
  const isSignedIn =
    Boolean(session?.user && "id" in session.user && session.user.id);

  return <NonCaseShell isSignedIn={isSignedIn}>{children}</NonCaseShell>;
}
```

Update `src/components/non-case-shell.tsx` to accept `isSignedIn` and keep pathname lookup client-side only:

```tsx
"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import { SiteNavigation } from "@/components/site-navigation";

export function NonCaseShell({
  children,
  isSignedIn,
}: {
  children: ReactNode;
  isSignedIn: boolean;
}) {
  const pathname = usePathname() ?? "/";

  return (
    <div className="min-h-screen bg-stone-100 text-stone-950">
      <SiteNavigation currentPath={pathname} isSignedIn={isSignedIn} />
      {children}
    </div>
  );
}
```

Replace `src/components/site-navigation.tsx` with a styled, mostly presentational header:

```tsx
import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";

type SiteNavigationProps = {
  currentPath: string;
  isSignedIn: boolean;
};

export function SiteNavigation({
  currentPath,
  isSignedIn,
}: SiteNavigationProps) {
  const links = isSignedIn
    ? [
        { href: "/apply", label: "Apply" },
        { href: "/vault", label: "Vault" },
      ]
    : [
        { href: "/apply", label: "Apply" },
        { href: "/signin", label: "Sign In" },
      ];

  return (
    <header className="border-b border-stone-300 bg-stone-100/95 backdrop-blur" role="banner">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link
          href="/"
          aria-current={currentPath === "/" ? "page" : undefined}
          className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-700"
        >
          Ashfall Collective
        </Link>
        <nav aria-label="Primary" className="flex flex-wrap items-center gap-3">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={currentPath === link.href ? "page" : undefined}
              className={currentPath === link.href
                ? "rounded-full bg-stone-950 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-50"
                : "rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700"}
            >
              {link.label}
            </Link>
          ))}
          {isSignedIn ? <SignOutButton /> : null}
        </nav>
      </div>
    </header>
  );
}
```

Create a minimal `src/components/sign-out-button.tsx` for now:

```tsx
"use client";

export function SignOutButton() {
  return (
    <button
      type="button"
      className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700"
    >
      Sign Out
    </button>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run tests/unit/site-navigation.test.tsx tests/unit/app-shell.test.tsx tests/integration/non-case-shell-routes.test.tsx`

Expected: PASS with the layout reading session state, the correct links hidden for each auth state, and the shared header visibly styled.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/(shell)/layout.tsx' src/components/non-case-shell.tsx src/components/site-navigation.tsx src/components/sign-out-button.tsx tests/unit/site-navigation.test.tsx tests/unit/app-shell.test.tsx tests/integration/non-case-shell-routes.test.tsx
git commit -m "feat: make shared shell navigation auth-aware"
```

### Task 3: Add real sign-out behavior and utilitarian auth loading states

**Files:**
- Create: `src/app/(shell)/loading.tsx`
- Create: `tests/unit/shell-loading.test.tsx`
- Create: `tests/unit/sign-out-button.test.tsx`
- Create: `tests/unit/signin-page.test.tsx`
- Modify: `src/components/sign-out-button.tsx`
- Modify: `src/app/(shell)/signin/page.tsx`
- Test: `tests/unit/shell-loading.test.tsx`
- Test: `tests/unit/sign-out-button.test.tsx`
- Test: `tests/unit/signin-page.test.tsx`

- [ ] **Step 1: Write the failing tests for sign-out and sign-in pending behavior**

Create `tests/unit/sign-out-button.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const { signOutMock } = vi.hoisted(() => ({
  signOutMock: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signOut: signOutMock,
}));

import { SignOutButton } from "@/components/sign-out-button";

beforeEach(() => {
  signOutMock.mockReset();
});

test("sign out shows a pending label while the request is running", async () => {
  let release = () => {};
  signOutMock.mockReturnValue(
    new Promise((resolve) => {
      release = () => resolve(undefined);
    }),
  );

  render(<SignOutButton />);

  fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

  expect(screen.getByRole("button", { name: /signing out/i })).toBeDisabled();

  release();
});
```

Create `tests/unit/signin-page.test.tsx`:

```tsx
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

const { signInMock } = vi.hoisted(() => ({
  signInMock: vi.fn(),
}));

vi.mock("next-auth/react", () => ({
  signIn: signInMock,
}));

import SignInPage from "@/app/(shell)/signin/page";

beforeEach(() => {
  signInMock.mockReset();
});

test("sign in button enters a pending state during credential submission", async () => {
  signInMock.mockReturnValue(new Promise(() => {}));

  render(<SignInPage />);

  fireEvent.change(screen.getByPlaceholderText(/agent@ashfall\.local/i), {
    target: { value: "agent@example.com" },
  });
  fireEvent.change(screen.getByPlaceholderText(/clearance phrase/i), {
    target: { value: "CaseFile123!" },
  });
  fireEvent.submit(screen.getByRole("button", { name: /report in/i }).closest("form")!);

  expect(screen.getByRole("button", { name: /reporting in/i })).toBeDisabled();
});
```

Create `tests/unit/shell-loading.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import ShellLoading from "@/app/(shell)/loading";

test("shell loading renders a lightweight route-progress treatment", () => {
  render(<ShellLoading />);

  expect(screen.getByText(/loading route content/i)).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run tests/unit/shell-loading.test.tsx tests/unit/sign-out-button.test.tsx tests/unit/signin-page.test.tsx`

Expected: FAIL because the sign-out button has no behavior and the sign-in page does not expose pending state.

- [ ] **Step 3: Implement the real sign-out flow, pending labels, and shell loading UI**

Update `src/components/sign-out-button.tsx`:

```tsx
"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";

export function SignOutButton() {
  const [isPending, setIsPending] = useState(false);

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={async () => {
        setIsPending(true);
        await signOut({ callbackUrl: "/" });
      }}
      className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {isPending ? "Signing Out..." : "Sign Out"}
    </button>
  );
}
```

Update `src/app/(shell)/signin/page.tsx` by adding `isPending` state around the existing submit flow:

```tsx
const [isPending, setIsPending] = useState(false);

onSubmit={async (event) => {
  event.preventDefault();
  setError(null);
  setIsPending(true);

  const form = new FormData(event.currentTarget);
  const email = String(form.get("email") ?? "");
  const password = String(form.get("password") ?? "");
  const result = await signIn("credentials", {
    email,
    password,
    callbackUrl: "/vault",
    redirect: false,
  });

  if (result?.error) {
    setError("Credentials rejected by Ashfall intake.");
    setIsPending(false);
    return;
  }

  window.location.assign(result?.url ?? "/vault");
}}

<button disabled={isPending} ...>
  {isPending ? "Reporting In..." : "Report In"}
</button>
```

Create `src/app/(shell)/loading.tsx`:

```tsx
export default function ShellLoading() {
  return (
    <div className="min-h-screen bg-stone-100 text-stone-950">
      <div className="h-1 w-full animate-pulse bg-[#d96c3d]" />
      <div className="mx-auto max-w-6xl px-6 py-4">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-600">
          Loading route content
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run tests/unit/shell-loading.test.tsx tests/unit/sign-out-button.test.tsx tests/unit/signin-page.test.tsx`

Expected: PASS with both auth actions exposing disabled pending labels during the async call.

- [ ] **Step 5: Commit**

```bash
git add 'src/app/(shell)/loading.tsx' src/components/sign-out-button.tsx 'src/app/(shell)/signin/page.tsx' tests/unit/shell-loading.test.tsx tests/unit/sign-out-button.test.tsx tests/unit/signin-page.test.tsx
git commit -m "feat: add auth action loading states"
```

## Chunk 3: Prove The Full Navigation Flow In Integration And The Browser

### Task 4: Update route-level tests and Playwright coverage for the new navigation behavior

**Files:**
- Modify: `tests/integration/non-case-shell-routes.test.tsx`
- Modify: `tests/e2e/navigation.spec.ts`
- Test: `tests/integration/non-case-shell-routes.test.tsx`
- Test: `tests/e2e/navigation.spec.ts`

- [ ] **Step 1: Write the failing integration and browser assertions**

Extend `tests/integration/non-case-shell-routes.test.tsx` with one signed-out shell case and one signed-in shell case that render `await ShellLayout({ children: <ApplyPage /> })` or `await ShellLayout({ children: await VaultPage() })` as appropriate, then assert the auth-driven nav matrix.

Update `tests/e2e/navigation.spec.ts` so the browser flow proves:

- `/` has no primary navigation and shows `Returning Agent Sign In` for signed-out visitors
- `/apply` and `/signin` have a styled primary nav, but no `Vault` link when signed out
- completing `/apply` lands on `/vault` with `Vault` and `Sign Out` visible, and no `Sign In`
- clicking `Sign Out` returns to `/` and restores the signed-out hero actions
- visiting `/cases/hollow-bishop` after intake still hides the shared primary nav and shows `Back to Vault`

Use concrete Playwright expectations such as:

```tsx
await expect(page.getByRole("navigation", { name: /primary/i })).toHaveCount(0);
await expect(page.getByRole("link", { name: /returning agent sign in/i })).toBeVisible();
await expect(page.getByRole("link", { name: /open vault/i })).toHaveCount(0);
...
await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
await page.getByRole("button", { name: /sign out/i }).click();
await page.waitForURL("**/");
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `pnpm vitest run tests/integration/non-case-shell-routes.test.tsx`

Run: `pnpm exec playwright test tests/e2e/navigation.spec.ts`

Expected: FAIL because the current browser flow still expects home-page nav and does not cover sign-out or the signed-in/signed-out action split.

- [ ] **Step 3: Make the smallest code adjustments required by the failing route tests**

If the updated tests reveal missing details, restrict implementation to route-flow polish only:

- adjust nav class names if the vault header is still visually plain
- tighten pending-button labels if the Playwright name queries do not match
- ensure the home route and shell route assertions align with the final copy

Do not broaden scope beyond the approved spec.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `pnpm vitest run tests/integration/non-case-shell-routes.test.tsx`

Run: `pnpm exec playwright test tests/e2e/navigation.spec.ts`

Expected: PASS with the browser flow covering signed-out home, signed-in vault, sign-out, and preserved case-route isolation.

- [ ] **Step 5: Commit**

```bash
git add tests/integration/non-case-shell-routes.test.tsx tests/e2e/navigation.spec.ts
git commit -m "test: cover auth-aware navigation flow"
```

### Task 5: Run full verification before handing the branch back

**Files:**
- Test only: no file edits

- [ ] **Step 1: Run the full Vitest suite**

Run: `pnpm vitest run`

Expected: PASS with all unit and integration suites green.

- [ ] **Step 2: Run the navigation Playwright spec**

Run: `pnpm exec playwright test tests/e2e/navigation.spec.ts`

Expected: PASS with the auth-aware shell flow and case-route isolation green.

- [ ] **Step 3: Inspect the worktree state**

Run: `git status --short`

Expected: clean working tree.

- [ ] **Step 4: Record any non-blocking warnings**

Capture but do not “fix while here”:

- Next.js inferred workspace root warning
- `middleware` deprecation warning
- `NEXTAUTH_URL` warning during Playwright

- [ ] **Step 5: Stop and hand off to execution**

At this point, execution should continue with `superpowers:subagent-driven-development` in this same worktree because subagents are available in the harness.
