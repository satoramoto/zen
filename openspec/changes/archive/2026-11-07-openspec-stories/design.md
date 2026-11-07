# Design

## Context

Zen already has two document-like areas with a pure model and React views held to the token contract: the research report and the compendium. The OpenSpec viewer follows the same shape. The CLI defines the artifact formats (`proposal.md`, `design.md`, `tasks.md`, `specs/<capability>/spec.md` with `### Requirement:` and `#### Scenario:` headings and `**WHEN**`/`**THEN**` steps; deltas under `## ADDED|MODIFIED|REMOVED|RENAMED Requirements`).

## Goals / Non-Goals

**Goals:**
- Read a root from a plain map of files, so a story, a test or an app can hand it any root without a filesystem.
- Draw the structure OpenSpec defines (requirements, scenarios, steps, deltas, tasks) rather than the raw Markdown, while keeping the prose as written.
- Dogfood: zen's own `openspec/` is a fixture.

**Non-Goals:**
- Editing specs or changes.
- Replacing `openspec validate`: the viewer draws what is there; it does not judge it.
- A full Markdown implementation: only the slice the artifacts use.

## Decisions

- A small Markdown parser of our own (headings, paragraphs, lists with task boxes, fenced code, quotes, inline code/emphasis/links) rather than a dependency: the artifacts use little, and the parser's blocks are what the spec and change parsers cut by heading.
- The root is read at build time in Storybook with Vite's `import.meta.glob` over `/openspec/**`, keyed by path relative to the root; the model never imports Node's `fs`.
- Views build on the primitives (`Text`, `Stack`, `Surface`) and read only contract variables; the area is React-only and not yet exported from the package.

## Risks / Trade-offs

- A hand-written parser will meet Markdown it does not know; it degrades to paragraphs rather than failing, and the sample fixture pins the shapes the CLI templates produce.
- `applyDelta` sketches what `openspec archive` does for display; the CLI remains the authority on the merged spec.
