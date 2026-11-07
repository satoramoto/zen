# Compendium: the book primitives

`src/library/compendium/` is the reading side of an interactive textbook. An entry is plain data
(`model/document.ts`) and `Document` draws it; a `Book` is entries in order with contents, a pager
and progress. The area knows an entry has a title, a standing, sections, claims, formulas,
figures, quantities, exercises, notes and references to other entries; it never knows what the
entry is about. Mathematics reaches a page three ways only: a formula is a TeX string typeset to
native MathML (temml, `model/formula.ts`); a figure is the name of a component the page is handed
in its registry (`src/library/math/` supplies those; this folder never imports it); an exercise's
answer goes to a checker by name (`exact` and `numeric` are built in; a page registers the rest).

The area is React-only and not yet exported from the package (`index.ts` is its own entry).
Stories are under a top-level **Compendium** section: `Compendium/Book` holds the two sample
textbooks (the Fourier book first), `Compendium/Layout/…` the page and column,
`Compendium/Components/…` each part on its own.

## The litmus test

The Fourier book re-tells, in its own words, the story a well-known explainer tells in a video:
drawings as sums of turning arrows, heat on a rod as the reason the question was asked, a step
as an infinite sum of cosines, one arrow and its coefficient, mirrored pairs as cosines, and the
spin-back-and-average formula for every coefficient. The test is whether a reader can feel each
idea rather than be told it: every chapter declares quantities the text scrubs and its figure
binds to, so the number in the sentence and the number in the drawing are one number, and
every chapter ends in exercises the page checks.

## Folders

| Folder | What's in it |
| --- | --- |
| `model/` | The document (`document.ts`), checkers and progress (`exercise.ts`), the book (`book.ts`), TeX to MathML (`formula.ts`), `validateEntry`, and their unit tests. No React. |
| `components/<Name>/` | One part each, with its stylesheet and stories: Formula, Mark, Peek, Sidenote, Figure, ProofGraph, Timeline, Scrub, Steps, Exercise. |
| `layout/<Name>/` | Reading (the column, `P`, `H`, `Wide`), Document (an entry), Book (entries with contents and a pager). |
| `book/` | Content, not primitives. `fourier/`: the litmus textbook, seven chapters on Fourier series as rotating arrows (`chapters.ts`, `fourier.book.ts`), each driven by a figure from `src/library/math/fourier/` framed in `figures.tsx`. The harmonic series book (`harmonic.book.ts`, `*.entry.ts`, `figures.ts`, HarmonicString) exercises every part in a few pages. |

## The model

| Piece | What it is |
| --- | --- |
| `Entry` | `id`, `title`, `kind`, `standing`, `summary` (its `EntryHead`, also what a peek shows), `path`, `quantities`, `sections`. |
| `Quantity` | A named number with a range and step. The page holds it: a `scrub` run sets it, a `ref` run shows it, a figure `bind` ties a prop to it (`{ harmonic: 'n' }` gives the figure `harmonic` and `onHarmonic`). |
| `Paragraph` | Runs: text, `{ tex }`, `{ peek }`, `{ mark }`, `{ note, cite? }`, `{ scrub }`, `{ ref, format? }`. |
| Blocks | `formula` (displayed TeX), `figure` (by registry name, with `props` and `bind`), `code`, `proof`, `timeline`, `steps` (paragraphs revealed one at a time), `exercise` (prompt, `check` by name, `expect`, `tolerance`, `hint`, `solution`). |
| `Book` | `chapters` in order and `heads`, a glossary of entries peeked at but not contained. `bookIndex` is what every page resolves peeks against. Progress is kept by `<chapter id>/<exercise id>`. |

Builders (`paragraph`, `tex`, `peek`, `mark`, `note`, `cite`, `scrub`, `ref`, `formula`, `figure`,
`code`, `proof`, `timeline`, `steps`, `exercise`, `section`) keep an entry close to how it's
written. `validateEntry` names what would stop it rendering (TeX temml rejects, a figure, entry,
quantity or checker the page lacks, a repeated exercise id, an empty paragraph); the book's
stories and `model/book.test.ts` hold every sample chapter to it.

## Verification

`npx vitest run src/library/compendium` for the model; `npm run typecheck`; `npm run build:storybook`
then `node scripts/compendium-stories.mjs <storybook url>` runs every Compendium play in headless
Chromium and takes screenshots at wide and narrow widths. The library rules in
`src/library/library.test.tsx` hold the area's CSS and TSX to the contract's variables.

## Next

- A figure face for the math explorers (they carry their own headings today), so a scene can sit
  in a page without breaking its outline.
- Checkers from the math area (an expression equal to another), registered by the page.
- A glossary page drawn from the book's heads; search across a book.
- Exporting the area once its model settles.
