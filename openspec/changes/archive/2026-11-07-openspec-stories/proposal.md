# Render OpenSpec roots in Storybook

## Why

Zen's Storybook is where its work is looked at, and OpenSpec is becoming how its work is planned; today a spec or a change can only be read as Markdown in an editor or the CLI's terminal dashboard. Drawing them with zen's own primitives puts specs where the components are, and gives the project a reason to keep its own `openspec/` folder honest: the stories render it.

## What Changes

- An **Openspec** Storybook section with three stories: a whole root (specs, active changes, archive, with an overview), one spec, and one change.
- A pure model that reads an OpenSpec root from its files: config, main specs with their requirements and scenarios, changes with proposal, design, tasks and per-capability deltas (added, modified, removed, renamed), and the archive.
- Zen's own `openspec/` folder initialised and read at build time as the dogfood fixture, beside a synthetic sample that exercises every shape.

## Capabilities

### New Capabilities

- `openspec-viewer`: reading an OpenSpec root from its files and drawing its specs and changes as documents.

### Modified Capabilities

(none)

## Impact

`src/library/openspec/` (new), `.storybook/preview.ts` (story order), `src/library/library.test.tsx` (the area's CSS and TSX held to the contract), `openspec/` (this project's root), `AGENTS.md`.
