# New Case Authoring Guide Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a canonical markdown guide that teaches contributors how to create a new staged case package in this repo, with starter templates, lightweight authoring guidance, and the right validation commands.

**Architecture:** Keep the implementation documentation-only. Create one guide under `docs/` that mirrors the current staged case contract from the schema and authored examples, then add a small README pointer so contributors can discover it without digging through the repository. Use source-backed cross-checks plus repo verification commands instead of inventing new tooling.

**Tech Stack:** Markdown, README documentation, TypeScript/Zod schema files as source material, pnpm build and validation scripts

---

## File Structure

Use `@verification-before-completion` before claiming the work is done. Because this rollout is documentation-only, rely on source-backed content checks and command verification rather than forcing `@test-driven-development` where it does not fit. If repo verification fails unexpectedly, use `@systematic-debugging`.

### Create

- `docs/create-a-new-case.md` - Canonical guide for authoring a new staged case package, including workflow, templates, authoring advice, validation notes, and a final checklist.
- `docs/superpowers/plans/2026-03-14-new-case-authoring-guide.md` - This implementation plan.

### Modify

- `README.md` - Add a short documentation pointer so contributors can find the new guide from the main repo entry point.

## Chunk 1: Author And Wire The Guide

### Task 1: Create the staged case authoring guide

**Files:**
- Create: `docs/create-a-new-case.md`
- Reference: `src/features/cases/case-schema.ts`
- Reference: `src/features/cases/evidence/schema.ts`
- Reference: `src/features/cases/validate-case-package.ts`
- Reference: `content/cases/red-harbor/manifest.json`
- Reference: `content/cases/red-harbor/protected.json`
- Reference: `README.md`
- Test: content audit of `docs/create-a-new-case.md`

- [ ] **Step 1: Write the guide skeleton and quick-start flow**

Create `docs/create-a-new-case.md` with these top-level sections:

```md
# Create a New Case

## What You Are Creating
## Quick Start
## Folder Structure
## Starter Templates
## Authoring Tips
## Validation And Common Mistakes
## Final Checklist
```

Make the `Quick Start` section show the happy path in order:

1. Create `content/cases/<slug>/`
2. Add `manifest.json`
3. Add `protected.json`
4. Add `evidence/` files
5. Run `pnpm validate:cases`
6. Run `pnpm build`

- [ ] **Step 2: Verify the guide skeleton is present**

Run: `rg -n '^# |^## ' docs/create-a-new-case.md`

Expected: one `# Create a New Case` heading and the six `##` sections listed above.

- [ ] **Step 3: Fill in the templates and required-field guidance**

Add copy-paste starter templates for:

- `manifest.json`
- `protected.json`
- markdown document evidence
- JSON record evidence
- JSON thread evidence
- JSON photo evidence

For each template section, add:

- what the file is for
- the fields a contributor must keep aligned
- one short "watch out for" note tied to actual schema or validation behavior

Ground the content in the current staged model only:

- `complexity`
- `stages`
- objective types `single_choice`, `multi_choice`, `boolean`, `code_entry`
- per-objective canonical answers

- [ ] **Step 4: Add lightweight authoring guidance and validation notes**

In the `Authoring Tips` and `Validation And Common Mistakes` sections, cover:

- how to scope `Light`, `Standard`, and `Deep`
- when to use each objective type
- how to keep stage unlocks reachable and non-cyclic
- when to use `document`, `record`, `thread`, and `photo`
- common validation failures from `validate-case-package.ts`

Make the validation section explicitly call out:

```bash
pnpm validate:cases
pnpm build
```

- [ ] **Step 5: Verify the completed guide content**

Run: `rg -n 'manifest\\.json|protected\\.json|pnpm validate:cases|pnpm build|single_choice|multi_choice|boolean|code_entry|document|record|thread|photo' docs/create-a-new-case.md`

Expected: matches for every required concept so the guide covers the staged contract, evidence families, and verification commands.

- [ ] **Step 6: Commit the guide**

```bash
git add docs/create-a-new-case.md
git commit -m "docs: add case authoring guide"
```

### Task 2: Make the guide discoverable from the repo entry point

**Files:**
- Modify: `README.md`
- Reference: `docs/create-a-new-case.md`
- Test: `README.md` content audit

- [ ] **Step 1: Add a short README pointer to the new guide**

Add a brief docs pointer near the existing repo overview or operator notes. Keep it short, for example:

```md
## Documentation

- [Create a New Case](docs/create-a-new-case.md) - starter guide for authoring a staged case package
```

The final wording can be adjusted to fit the README tone, but it should make the guide easy to find.

- [ ] **Step 2: Verify the README link and guide path**

Run: `rg -n 'Create a New Case|docs/create-a-new-case\\.md' README.md docs/create-a-new-case.md`

Expected: the README points at the new file, and the guide file exists at that path.

- [ ] **Step 3: Run repo verification**

Run: `pnpm validate:cases`
Expected: `Validated 3 case packages.`

Run: `pnpm build`
Expected: successful production build with exit code 0.

- [ ] **Step 4: Commit the README wiring**

```bash
git add README.md
git commit -m "docs: link case authoring guide"
```
