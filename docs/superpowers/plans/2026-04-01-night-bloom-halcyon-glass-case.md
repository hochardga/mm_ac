# Night Bloom at Halcyon Glass Case Merge Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the new `night-bloom-halcyon-glass` case to `content/cases/` by combining the cleaner package metadata with the complete authored evidence set and supporting author notes.

**Architecture:** Use the package-export folder as the canonical source for `manifest.json`, `protected.json`, `introduction/transcript.md`, and `author-hints.md`, then merge in the full evidence payloads from the raw authored folder. Keep the case self-contained under `content/cases/night-bloom-halcyon-glass/` and leave the temporary source folders untouched.

**Tech Stack:** JSON, Markdown, shell file copy utilities, repository validation commands (`pnpm validate:cases`, `pnpm test`, `pnpm build`).

---

### Chunk 1: Assemble the case package

**Files:**
- Create: `content/cases/night-bloom-halcyon-glass/manifest.json`
- Create: `content/cases/night-bloom-halcyon-glass/protected.json`
- Create: `content/cases/night-bloom-halcyon-glass/introduction/transcript.md`
- Create: `content/cases/night-bloom-halcyon-glass/author-hints.md`
- Create: `content/cases/night-bloom-halcyon-glass/evidence/*`

- [ ] **Step 1: Copy the package metadata and intro**

Copy the cleaned package-export versions of `manifest.json`, `protected.json`, and `introduction/transcript.md` into `content/cases/night-bloom-halcyon-glass/`.

- [ ] **Step 2: Copy the authored evidence payloads**

Copy every real evidence artifact from `_tmp/night-bloom-halcyon-glass/evidence/` into `content/cases/night-bloom-halcyon-glass/evidence/`, preserving filenames and omitting `.DS_Store`.

- [ ] **Step 3: Preserve the author-only helper notes**

Copy `author-hints.md` from the package-export folder into the new case folder so the author can keep working from the staged bundle.

### Chunk 2: Validate and prepare for review

**Files:**
- Test: repo validation output
- Test: build output

- [ ] **Step 1: Run case validation**

Run: `pnpm validate:cases`
Expected: passes for `night-bloom-halcyon-glass` with no missing evidence or schema errors.

- [ ] **Step 2: Run the repo test suite**

Run: `pnpm test`
Expected: pass without regressions from the new case package.

- [ ] **Step 3: Run the production build**

Run: `pnpm build`
Expected: pass before any push or handoff.

- [ ] **Step 4: Review the final file list**

Run: `git status --short`
Expected: only the intended new case files appear under `content/cases/night-bloom-halcyon-glass/` plus the plan document.
