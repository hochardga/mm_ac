# Ashfall Auth-Aware Navigation Follow-Up Design

Date: 2026-03-13

## Summary

The first-pass navigation shell made top-level routes reachable, but testing exposed gaps in presentation and auth behavior. The home page still shows an unstyled shared header, signed-out users can see `Vault`, signed-in users can still see `Sign In`, there is no sign-out action, and important auth transitions do not communicate loading.

This follow-up design keeps the original route split, but sharpens ownership. The root landing page returns to a hero-only entry experience, while `/apply`, `/signin`, and `/vault` share a styled, server-aware shell that renders only the actions relevant to the current session. Loading feedback stays utilitarian: quick, clear, and low-noise.

## Goals

- Remove the shared top navigation from `/` and rely on the home hero actions instead.
- Render a styled non-home shell for `/apply`, `/signin`, and `/vault`.
- Hide `Sign In` when a valid session exists.
- Hide `Vault` when no valid session exists.
- Add an explicit `Sign Out` action for signed-in users.
- Add utilitarian loading feedback for shell route transitions and auth actions.
- Keep case and debrief routes immersive, with their existing minimal return path.

## Non-goals

- Redesign the application, sign-in, or vault pages beyond what is required to support the new shell.
- Change route protection policy or case access rules.
- Add profile menus, account settings, or session-expiry UX beyond the existing auth model.
- Add ornate spinners, blocking overlays, or animated marketing-style transitions.

## Product Approach

The navigation experience should now use three distinct surfaces:

1. A hero-only landing page at `/`.
2. A shared auth-aware shell for `/apply`, `/signin`, and `/vault`.
3. The existing case-local header for `/cases/[caseSlug]` and `/cases/[caseSlug]/debrief`.

This keeps the home page immersive and uncluttered, while making the practical routes feel stable and consistent. The shared shell becomes the single place where signed-in versus signed-out navigation decisions live.

## Route Experience

### Home page

The root route should not render the shared navigation header. It should remain a focused landing page with:

- `Apply for Field Status` as the primary action.
- A secondary `Returning Agent Sign In` action only when the visitor is signed out.
- A secondary `Open Vault` action only when the visitor is signed in.
- The existing Ashfall landing copy and hero presentation.

The home page should not show duplicate top-level navigation above the hero.

### Shared non-home shell

The shared shell should own `/apply`, `/signin`, and `/vault`. It should render a styled Ashfall header with consistent spacing and route context. The header should be server-aware so it can choose actions before the page reaches the browser.

Signed-out state:

- Show brand link to `/`.
- Show `Apply`.
- Show `Sign In`.
- Do not show `Vault`.
- Do not show `Sign Out`.

Signed-in state:

- Show brand link to `/`.
- Show `Apply`.
- Show `Vault`.
- Show `Sign Out`.
- Do not show `Sign In`.

The header should feel like part of the app, not raw browser-default links. It should visually match the existing Ashfall palette and remain consistent across `Apply`, `Sign In`, and `Vault`.

### Vault page

The vault should keep the shared shell header and should not add a competing local toolbar above the dossier content. Its top navigation should inherit the same styling and auth-aware behavior as the rest of the shared shell.

### Active case pages

Case and debrief pages continue to avoid the shared shell. They should keep the existing minimal return treatment and should not inherit the auth-aware top bar.

## Authentication Behavior

- Navigation visibility should be driven by the same session source already used by protected routes: `getServerSession(authOptions)`.
- The shared shell should not rely on client-only session checks for primary navigation visibility, because that can briefly show the wrong actions during hydration.
- The same auth-aware decision should be available to the home page so its hero actions do not offer both `Sign In` and `Vault` at the same time.
- `Sign Out` should clear the existing NextAuth session and return the user to a non-protected route such as `/`.

## Loading Behavior

Loading should stay utilitarian and lightweight.

### Route-level loading

The shared non-home shell should provide a simple route-group loading state for navigation between `/apply`, `/signin`, and `/vault`. A thin top progress treatment or similarly restrained shell-level loading affordance is appropriate. The goal is to show that navigation is happening without obscuring content.

### Action-level loading

Interactive auth controls should expose pending states:

- Sign-in submit button disables and swaps to a concise pending label such as `Reporting In...`.
- Sign-out control disables and swaps to a concise pending label such as `Signing Out...`.
- Where buttons or links trigger client-side navigation from the shared shell, pending affordances should avoid duplicate submissions or repeated clicks.

Inline errors, such as rejected credentials, should remain visible and should not be replaced by loading chrome.

## Component Boundaries

### Server-owned navigation shell

Create or reshape the non-home layout so it is server-rendered and can call `getServerSession(authOptions)` once for the request. This layout should pass small, presentation-friendly auth state into the header rather than pushing session logic deep into multiple pages.

Responsibilities:

- Determine signed-in versus signed-out navigation state.
- Render the shared header on `/apply`, `/signin`, and `/vault`.
- Provide shell-level loading UI for those routes.

Non-responsibilities:

- Case-page navigation.
- Business logic specific to application intake or dossier listing.
- Credential form submission internals.

### Styled site navigation

The shared header component should be mostly presentational. It should accept enough data to render the correct actions and active-route highlighting without reaching back into auth APIs on its own.

### Client sign-out control

If `Sign Out` needs client interactivity, isolate it in a small client component that owns pending state and redirects after the session clears. Keep this responsibility out of the broader header component.

### Home page hero actions

The root page should own its hero actions directly. It may reuse a small helper for auth-aware action selection if that keeps the logic focused, but it should not be wrapped in the shared shell.

## Edge Cases

- Signed-out visitors who manually request `/vault` should still be handled by the existing route protection logic.
- Signed-in visitors who open `/signin` should not see a misleading `Sign In` nav item, even if the page itself remains reachable.
- Loading states should not trap keyboard focus or block error messaging.
- The shell should not regress the existing demo environment banner or root metadata behavior.

## Testing Strategy

Required coverage:

- Home route does not render the shared primary navigation.
- Signed-out home route shows `Returning Agent Sign In` and does not show `Open Vault`.
- Signed-in home route shows `Open Vault` and does not show `Returning Agent Sign In`.
- Signed-out shared-shell routes render `Apply` and `Sign In`, but not `Vault` or `Sign Out`.
- Signed-in shared-shell routes render `Apply`, `Vault`, and `Sign Out`, but not `Sign In`.
- Shared-shell navigation is visibly styled on the vault route rather than plain text.
- Sign-in submit enters a pending state before completing.
- Sign-out enters a pending state before completing.
- Case and debrief routes still do not render the shared primary nav.

Playwright should keep the route-level verification for real navigation behavior. Unit or integration tests should cover the auth-driven rendering matrix and pending labels where browser coverage would be unnecessarily heavy.

## Implementation Notes

- Prefer the smallest route-boundary change that removes the home page from the shared shell while preserving the current case isolation.
- Reuse existing NextAuth session plumbing instead of introducing a second auth state source.
- Keep loading UI minimal and textual where possible.
