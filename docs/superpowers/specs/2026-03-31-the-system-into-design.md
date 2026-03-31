# The System Introduction Page Design

Date: 2026-03-31

## Summary

Add a hidden, shareable introduction page for "the system" at `/the-system-intro`. The page should live behind the login boundary already used elsewhere in the app, should not appear in navigation, and should feel like a deliberate dossier artifact rather than a standard site page.

The page must show the supplied transcript, attempt to autoplay the narration audio when the browser allows it, and offer a clear action button that takes the user to the vault.

## Goals

- Provide a polished shareable page that feels like an in-universe Ashfall briefing.
- Keep the page behind the existing authenticated boundary.
- Keep the page out of visible navigation and out of any other in-app link surface.
- Render the transcript in a way that preserves the supplied script formatting and pauses.
- Attempt audio autoplay on load, with an obvious fallback control when the browser blocks playback.
- Give the page one primary action: go to the vault.

## Non-Goals

- Do not add the page to the primary site navigation.
- Do not reuse the case introduction modal or case progression system.
- Do not add tracking, progress persistence, or read receipts.
- Do not make the page discoverable through the vault, home page, or case flows.
- Do not build a general marketing CMS or page-authoring framework.
- Do not introduce unrelated visual redesigns in the shell or vault.

## Approaches Considered

### Recommended: Standalone authenticated dossier page

Create a dedicated authenticated route for `/the-system-intro`, load the transcript from a page-specific content bundle, and serve the narration through a protected audio endpoint. This keeps the page self-contained, easy to share, and clearly separated from case content.

### Reuse the case introduction infrastructure

Load the page through the existing case introduction helpers and modal patterns, treating the system intro as a pseudo-case. This would reduce some duplication, but it couples a marketing page to the case domain and makes the content model feel wrong.

### Static page with public audio asset

Render a simple page and place the audio in `public/` for easy loading. This is the smallest implementation, but it breaks the intent of keeping the page behind login because the asset can be fetched directly.

## Selected Architecture

### Route and auth boundary

- Create the page at `src/app/(app)/the-system-intro/page.tsx`.
- Protect the route with the same login gate used for vault and case routes.
- Extend the route protection rules and middleware matcher so unauthenticated visitors are redirected to the existing sign-in flow.
- Keep the page outside the shell layout so it does not inherit the normal navigation chrome.
- Do not add any route links to this page from the app chrome.

This keeps the page hidden in practice while still making the URL shareable for intentional use.

### Content contract

- Store the page content in a dedicated bundle at `content/the-system-intro/`.
- `transcript.md` is required and should be treated as the authoritative text.
- `audio.mp3` is optional in the contract, but the first rollout should include it.
- The transcript loader should return a normalized string and preserve line breaks, bracketed cue text, and pauses.
- If the transcript is missing, empty, or unreadable, the page should fail closed rather than rendering a blank teaser.
- If the audio file is missing, the page should still render transcript-only.

The content bundle should stay page-specific. This is not the start of a general page CMS.

### Page composition

- Render the page as a single centered dossier panel on a dark, cinematic background.
- Use the centered dossier direction from the mockup: one contained card, one transcript block, one primary vault CTA.
- Keep the page visually spare, with the transcript as the main body content and only a small amount of supporting copy.
- Show the transcript in a preserved script-style block, not a markdown article, so the stage cues and spacing remain intact.
- Place the audio block above the transcript.
- The vault action should be the primary button at the bottom of the panel.
- No secondary navigation, breadcrumbs, or other exits should appear on the page.

This should feel intentional and secretive, not like a normal app screen.

### Audio playback behavior

- Use a client-side playback wrapper for the audio block so the page can try autoplay on mount.
- If autoplay succeeds, the page should simply continue in the playing state.
- If autoplay is blocked, surface a visible `Play Audio` control and keep the transcript fully accessible.
- If playback fails because the audio request cannot load, the transcript should still render and the page should remain usable.
- The audio should not be muted by default. The goal is to play the narration if the browser allows it.

### Navigation and CTA behavior

- The only in-page action should be a button or link that sends the user to `/vault`.
- Keep the vault CTA visually prominent and easy to find.
- Do not add any link back to the hidden page from the vault or home page.
- Do not create any "copy link" or sharing UI; the shareable URL is enough.

### Error handling

- Unauthorized requests should be redirected by the existing auth boundary.
- Missing transcript content should result in a hard failure state rather than an empty page.
- Missing audio should degrade to transcript-only.
- Autoplay rejection should degrade to a visible play control without affecting the transcript or vault CTA.
- The page should not write to the database or depend on any mutable state.

## Definition Of Done

- `/the-system-intro` is accessible only to authenticated users.
- The page does not appear in the visible navigation.
- The page renders the supplied transcript with formatting preserved.
- The narration attempts autoplay on load and falls back cleanly if blocked.
- The page includes a clear action to navigate to `/vault`.
- Missing audio degrades gracefully.
- Missing transcript content fails closed.
- `pnpm build` passes after implementation.

## Files And Responsibilities

### Create

- `src/app/(app)/the-system-intro/page.tsx`: server page that assembles the hidden intro experience.
- `src/features/the-system-intro/load-system-intro.ts`: loader for the page-specific transcript and optional audio asset.
- `src/features/the-system-intro/components/system-intro-panel.tsx`: client component that handles autoplay, fallback controls, and the centered dossier layout.
- `src/app/api/the-system-intro/audio/route.ts`: protected audio endpoint for the narration file.
- `content/the-system-intro/transcript.md`: the supplied transcript.
- `content/the-system-intro/audio.mp3`: the supplied narration audio.

### Modify

- `src/lib/route-protection.ts`: treat `/the-system-intro` as protected.
- `src/proxy.ts`: include the new page and audio endpoint in the auth matcher.
- `tests/integration/auth-route.test.ts`: verify the new route is considered protected.
- `tests/unit/system-intro-loader.test.ts`: cover transcript loading, missing transcript, and optional audio behavior.
- `tests/unit/system-intro-panel.test.tsx`: cover autoplay success, autoplay fallback, and vault CTA rendering.
- `tests/integration/system-intro-page.test.tsx`: cover authenticated rendering and unauthenticated redirect behavior.

## Verification

The implementation should be considered complete only after the focused tests and a full build pass:

```bash
pnpm vitest run tests/unit/system-intro-loader.test.ts tests/unit/system-intro-panel.test.tsx tests/integration/system-intro-page.test.tsx tests/integration/auth-route.test.ts
pnpm build
```

## Rollout

1. Add the dedicated intro loader and protected audio route.
2. Build the centered dossier page and autoplay fallback behavior.
3. Protect the route in middleware and add the route-protection test coverage.
4. Copy in the supplied transcript and audio.
5. Verify the page stays hidden from navigation and still routes cleanly to the vault.
