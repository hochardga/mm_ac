# New Case Authoring Guide Design

Date: 2026-03-14

## Summary

Ashfall Collective should gain a markdown guide that explains exactly how to author a new case in the current staged-case system.

The guide should serve newer contributors first. It needs to explain the required repo structure, provide copy-paste starter templates, and offer lightweight creative guidance for choosing stages, objectives, and evidence without turning into a general mystery-writing manual.

The guide should describe only the current staged format used for new work.

## Goals

- Give contributors one canonical markdown guide for creating a new case package in this repo.
- Explain the required authored files and how they relate to one another.
- Provide copy-paste starter templates for `manifest.json`, `protected.json`, and supported evidence file types.
- Include a short happy-path workflow so a first-time contributor can follow the process in order.
- Add lightweight authoring guidance for case scope, stage design, objective types, and evidence choices.
- Anchor the guide in the repo's real validation workflow, including `pnpm validate:cases` and `pnpm build`.

## Non-goals

- Documenting the legacy non-staged case format.
- Building an internal CMS or tooling for case generation.
- Teaching general mystery plotting, pacing, or narrative theory.
- Replacing schema code or tests as the source of truth for runtime validation.

## Audience

The primary audience is a contributor who is new to Ashfall Collective's case-authoring model and needs both exact repo requirements and a small amount of practical design guidance.

The guide should still work as a quick reference for returning contributors, so it must be easy to skim by section.

## Product Approach

The preferred format is a hybrid reference guide with a short "happy path" spine near the top.

The guide should open with a concise checklist that shows the authoring order:

1. create a new folder under `content/cases/<slug>/`
2. draft `manifest.json`
3. draft `protected.json`
4. add evidence files under `evidence/`
5. validate the package with repo commands

After that quick-start path, the document should shift into reference sections with templates, field explanations, authoring advice, and a final pre-PR checklist.

This approach balances onboarding and long-term usability better than either a pure tutorial or a pure schema reference.

## Proposed Guide Structure

The guide should be one markdown document with these sections:

1. `# Create a New Case`
2. What a new case package includes
3. Quick-start checklist
4. Expected folder structure
5. Starter templates
6. How to choose complexity, stages, objectives, and evidence
7. Validation commands and common mistakes
8. Final pre-PR checklist

The quick-start and folder-structure sections should be short and operational. The templates and guidance sections should carry most of the detail.

## Content Model Coverage

The guide should explain the staged case package as three aligned authored layers:

- `manifest.json` for player-safe metadata, evidence references, stages, and objectives
- `protected.json` for grading limits, canonical answers, and debriefs
- `evidence/` payload files for the actual case artifacts

For each layer, the guide should include:

- a copy-paste starter template
- a compact list of required fields
- a short explanation of how it connects to the rest of the package
- a short "watch out for" note covering likely validation failures

The guide should explicitly frame `manifest.json` and `protected.json` as a pair that must stay in sync:

- stage and objective ids in the manifest define the playable structure
- canonical answers in `protected.json` must use matching objective ids and matching answer shapes
- evidence ids referenced in stages must exist in the manifest's evidence list
- evidence `source` values in the manifest must point to real files under the case folder

## Templates

The guide should include starter templates for:

- staged `manifest.json`
- staged `protected.json`
- markdown document evidence
- JSON record evidence
- JSON thread evidence
- JSON photo evidence

Each template should be intentionally minimal but valid-looking, with placeholders that make the expected shape obvious without overwhelming the reader.

The templates should favor the staged format currently represented by the repo's authored cases:

- `complexity` instead of `estimatedMinutes`
- `stages` instead of legacy top-level `handlerPrompts` and `reportOptions`
- per-objective canonical answers instead of one case-level suspect/motive/method answer block

## Authoring Guidance

The guide should include lightweight practical advice tied to the current product model rather than abstract narrative advice.

Topics to cover:

- how to scope `Light`, `Standard`, and `Deep` cases
- how to choose between `single_choice`, `multi_choice`, `boolean`, and `code_entry`
- how to break a case into stages without creating unreachable or overly busy progression
- when to use `document`, `record`, `thread`, and `photo` evidence
- how to write summaries, prompts, and debriefs that are clear without spoiling the answer

This section should stay concrete and brief. The goal is to help contributors avoid common design mistakes while preserving creative freedom.

## Validation And Error Handling

The guide should ground the authoring workflow in the repo's current verification commands.

Required commands to highlight:

- `pnpm validate:cases` after authoring changes
- `pnpm build` before pushing code

The guide should call out likely failures that matter to new contributors:

- duplicate stage ids, objective ids, or evidence ids
- no stage marked `startsUnlocked: true`
- unlock graphs that reference unknown stages
- unreachable stages or cyclic stage unlocks
- evidence ids referenced by stages that do not exist in the manifest
- manifest `source` paths that do not match a real file
- canonical answer payloads in `protected.json` that do not match the objective type

## Implementation Notes

The guide should be derived from the current staged authoring contract in:

- `src/features/cases/case-schema.ts`
- `src/features/cases/evidence/schema.ts`
- `src/features/cases/validate-case-package.ts`
- existing authored cases under `content/cases/`
- current operator notes in `README.md`

The implementation should follow the repo's existing documentation tone: concise, practical, and focused on current behavior rather than future ideas.

## Success Criteria

The guide is successful if a new contributor can use it to:

- create a correctly shaped staged case package without reading schema code first
- understand which files are required and how they relate
- choose reasonable objective and evidence types for a new case
- run the right validation commands before opening a PR

## Open Questions

No major open questions remain for the first version.

Implementation can proceed with one guide document focused on new staged-case authoring only.
