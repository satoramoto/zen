# Compendium: the book primitives

`src/library/compendium/` is the reading side of an interactive textbook: an entry is plain data
(`model/document.ts`) and `Document` draws it. The area knows an entry has a title, a standing,
sections, claims, formulas, figures, notes and references to other entries; it never knows what
the entry is about. Mathematics reaches a page two ways only: a formula is a TeX string typeset to
native MathML (temml, `model/formula.ts`), and a figure is the name of a component the page is
handed in its registry (`src/library/math/` supplies those; this folder never imports it).

The area is React-only and not yet exported from the package. Stories are under
`Design OS/Compendium/…`; `Entry` is the acceptance page, "The harmonic series"
(`harmonic.entry.ts`), with its figure registry and the heads of the entries it peeks at.

## The model

| Piece | What it is |
| --- | --- |
| `Entry` | `id`, `title`, `kind`, `standing`, `summary`, `path` (where it sits), `sections`. The first five are its `EntryHead`, which is also what a peek shows of it. |
| `Section` | A heading and blocks. |
| `Paragraph` | Runs: text, `{ tex }` an inline formula, `{ peek }` a mention of another entry by id, `{ mark }` the standing of the claim that follows, `{ note, cite? }` a sidenote. |
| `FormulaBlock` | A displayed formula, TeX, with a `label` in words. |
| `FigureBlock` | A figure by registry name and its props. |
| `CodeBlock`, `ProofBlock`, `TimelineBlock` | The wide blocks. |

Builders (`paragraph`, `tex`, `peek`, `mark`, `note`, `cite`, `formula`, `figure`, `code`,
`proof`, `timeline`, `section`) keep an entry close to how it's written. `validateEntry` names
what would stop the entry rendering as written (TeX temml rejects, a figure or entry the page
can't resolve, an empty paragraph); the Entry story's play and `model/document.test.ts` hold the
harmonic series to it.

## The view

| Component | Responsibility |
| --- | --- |
| `Document` | The page: head, then each section's blocks; resolves figures and peeks. |
| `Reading`, `P`, `H`, `Wide` | The reading column at a measure, a margin to its right for notes, wide blocks that take both. |
| `Mark`, `MarkLegend` | A claim's standing: a shape and a colour slot, never colour alone. |
| `Sidenote` | A numbered note hung in the margin beside its line; folds inline when narrow. |
| `Peek` | A mention of another entry with a hover or tap preview (a `Popover`). |
| `Formula` | TeX typeset to MathML, or hand-written MathML children; set in the contract's math face. |
| `Figure` | A live illustration with its control, a "what changes" line and a source. |
| `ProofGraph`, `Timeline`, `HarmonicString` | The wide specimens. |

## Next

- Exercises: a block with a prompt, an expected answer and a checker name, resolved like a figure.
- An entry index, so peeks and proof nodes resolve across a book rather than a page.
- A figure face for the math explorers (they carry their own headings today), so a scene can sit
  in a page without breaking its outline.
- Exporting the area once its model settles.
