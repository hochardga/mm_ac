# Ashfall Navigation Design

Date: 2026-03-13

## Summary

Ashfall Collective needs a visible route structure so players can move between the landing page, intake, sign-in, and dossier vault without relying on direct URLs. The navigation update should make the home page feel like a clear entry point while preserving the immersive focus of active case pages.

The preferred direction is a landing-style home page with a practical global navigation shell on non-case routes. Active case routes should intentionally avoid the full global shell and instead expose only a minimal way back to the vault or home.

## Goals

- Add obvious navigation paths between the existing top-level pages.
- Turn the home page into a useful landing experience instead of a placeholder.
- Keep `Apply` as the primary call to action for new visitors.
- Preserve the focused, low-distraction feel of active case pages.
- Follow the project's existing Ashfall voice without making navigation harder to use.

## Non-goals

- Redesign the application, intake, sign-in, vault, or case flows from scratch.
- Change route protection or authentication policy.
- Add account menus, settings surfaces, or new destinations that do not already exist.
- Introduce complex session-aware personalization in the header if it adds avoidable layout logic.

## Product Approach

The app should use two navigation modes:

1. A shared non-case shell for landing, intake, sign-in, and vault routes.
2. A case-local header for active investigations.

This split keeps the top-level app understandable while protecting the investigation workspace from becoming crowded or feeling like a generic dashboard.

## Route Experience

### Home page

The root route should become a true landing page for Ashfall Collective rather than a temporary placeholder. It should:

- Introduce the Ashfall premise in a short, focused hero section.
- Make `Apply` the dominant action.
- Offer secondary links to `Sign In` and `Vault`.
- Reuse the shared non-case header so the route structure is visible immediately.

The home page should feel more intentional than purely utilitarian, but it should still read as an entry screen for a product rather than a marketing microsite.

### Public and authenticated non-case pages

The following routes should render inside the shared navigation shell:

- `/`
- `/apply`
- `/signin`
- `/vault`

The shell should be lightweight and practical. It should include:

- Ashfall brand label or wordmark linking to `/`
- Top-level links for `Apply`, `Sign In`, and `Vault`
- Current-route indication so users can tell where they are

The first pass should keep the shared navigation static. It does not need session-aware emphasis or per-user link changes, and existing route guards should continue to handle protected destinations.

### Active case pages

Case routes such as `/cases/[caseSlug]` and `/cases/[caseSlug]/debrief` should not render the global header. They should use a slim local header inside the case page that provides:

- Case context
- A minimal `Back to Vault` action
- An optional subtle `Home` link if it fits the composition without competing with the primary return path

This local header should be visually quieter than the non-case shell so the evidence, notes, and report tools remain the focus.

### Shell ownership matrix

- `/`: shared non-case shell plus landing content
- `/apply`: shared non-case shell
- `/signin`: shared non-case shell
- `/vault`: shared non-case shell
- `/cases/[caseSlug]`: case-local header only
- `/cases/[caseSlug]/debrief`: case-local header only

## Component Boundaries

### Shared navigation shell

A reusable navigation component should own the non-case header structure and route links. The shell should be mounted at a layout boundary that covers home, public auth routes, and the vault without forcing active case pages to inherit it.

Route-group or nested-layout restructuring is acceptable if needed to let `/vault` share the non-case shell while keeping the entire `/cases/*` subtree out of that shell.

Responsibilities:

- Render the shared top-level header
- Provide consistent spacing for non-case pages
- Surface current-route context

Non-responsibilities:

- Authentication enforcement
- Case-page controls
- Player-specific business logic beyond lightweight presentation decisions

### Landing content

The home page should own its hero copy and primary action block separately from the shared header. This keeps the navigation reusable and allows the home page to carry the extra orientation content that other routes do not need.

### Case-local header

Case routes should own their own minimal header rather than asking the shared shell to behave differently by prop or mode flag. That keeps the case workspace easier to understand and avoids one navigation component trying to satisfy two incompatible contexts.

On the main case page, the case-local header should replace the current top hero-style intro block rather than stacking on top of it. On the debrief page, the same principle applies: one local header region should provide orientation without duplicating another full-width intro section above it.

## Behavior and Edge Cases

- Existing redirect behavior stays unchanged, with these acceptance outcomes preserved:
- Anonymous visitors who open `/cases/[caseSlug]` or `/cases/[caseSlug]/debrief` redirect to `/apply`.
- Signed-in users or cookie-backed users with valid case access continue into the route.
- Missing case definitions still resolve to `notFound()`.
- Debrief routes for users without a matching player-case still resolve to `notFound()`.
- The vault route remains the main return surface for investigation work.
- The minimal case back path should not depend on client-side history being available; it should use explicit links.
- Navigation labels should stay short and stable across routes.
- The app metadata should be updated from the default Next.js scaffold so browser titles and descriptions match the new landing experience.

## Visual Direction

- Non-case navigation should be clean and readable, using the app's established Ashfall palette and tone.
- The home page can be slightly more expressive than the other shared-shell routes because it is the orientation surface.
- Active case pages should continue to feel immersive and operational rather than site-like.

## Testing Strategy

Verification should focus on route behavior and shell boundaries rather than pixel-specific styling.

Required coverage:

- Shared navigation renders on the home page.
- Shared navigation renders on `Apply`, `Sign In`, and `Vault`.
- Active case pages do not render the full global shell.
- Active case pages render the minimal return path to the vault.
- Home page surfaces `Apply` as the primary call to action.

Playwright is a good fit for route-level presence checks if the existing suite already covers navigation-capable app startup. Component or render tests are also acceptable for static header visibility as long as they clearly validate the layout split.

## Implementation Notes

- Prefer the smallest layout restructuring that cleanly separates non-case routes from case routes.
- Reuse existing page styling patterns where possible instead of introducing a new design system.
- Keep the first pass focused on navigation clarity; additional polish can build on the new shell later if needed.
