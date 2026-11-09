# Compendium: the book primitives

`src/library/compendium/` is the reading side of an interactive textbook. An entry is plain data
(`model/document.ts`) and `Document` draws it; a `Book` is entries in order with contents, a pager
and progress. The area knows an entry has a title, a standing, sections, claims, formulas,
figures, quantities, exercises, notes and references to other entries; it never knows what the
entry is about. Mathematics reaches a page three ways only: a formula is a TeX string typeset to
native MathML (temml, `model/formula.ts`); a figure is the name of a component the page is handed
in its registry (`src/library/math/` supplies those; this folder never imports it); an exercise's
answer goes to a checker by name (`exact` and `numeric` are built in; a page registers the rest).

The reader is React-only, exported through `@satoramoto/zen/compendium`; pure authoring
helpers use `@satoramoto/zen/compendium/model`. Import `@satoramoto/zen/zen.css` once.
See [the package guide](../../../docs/compendium-package.md) for SSR and local-source use.
Stories are under a top-level **Compendium** section: `Compendium/Book` holds the two sample
textbooks (the Fourier book first), `Compendium/Layout/…` the page and column,
`Compendium/Components/…` each part on its own.

## The look

Two theme packs are made for the page (`themes/packs.ts`): **textbook-console** (a dark research
console: deep navy, JetBrains Mono readouts, one green action and a soft glow, after Refero's
Midjourney style) and **textbook-blueprint** (a warm paper blueprint: Bricolage Grotesque
headings, Newsreader reading text, slate ink rules, one vermilion and one highlight yellow, hard
offset shadows, after Timescale and 19-86). Both sit on the `airy` scale and the `textbook`
principles. Running text reads `--font-reading`, the contract's `reading` face (the sans when a
pack has none). The page draws a chapter plate (number, book, counts), numbered sections, a
ruled figure caption with its number, a numbered exercise, and in the Book a chapter ledger
with the chapter's live quantities. `scripts/compendium-stories.mjs <url> <shots> [pack]` runs
every play against a served build under a pack and screenshots the books in both packs.

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
| `components/<Name>/` | One part each, with its stylesheet and stories: Formula, Mark, Peek, Sidenote, Figure, ProofGraph, Timeline, Scrub, Steps, Exercise, Table. |
| `layout/<Name>/` | Reading (the column, `P`, `H`, `Wide`), Document (an entry), Book (entries with contents and a pager). |
| `book/` | Content, not primitives. `fourier/`: the litmus textbook, seven chapters on Fourier series as rotating arrows (`chapters.ts`, `fourier.book.ts`), each driven by a figure from `src/library/math/fourier/` framed in `figures.tsx`. The harmonic series book (`harmonic.book.ts`, `*.entry.ts`, `figures.ts`, HarmonicString) exercises every part in a few pages. `checkers.ts` registers the math area's expression checker for both. `prime-waves/`: a one-chapter book rebuilding a video's pictures of primes as waves, with figures from `src/library/math/primes/`; it marks each claim's standing and says which patterns come from the primes, which from small numbers' arithmetic, and which from the screen. **A course goes under `book/<course>/`** (`chapters/`, `glossary.ts`, `figures.tsx`, `checkers.ts`, `<course>.book.ts`), with its figures in `src/library/math/<family>/`; a primitive it lacks becomes its own change first, never a special case inside the course. |

## The model

| Piece | What it is |
| --- | --- |
| `Entry` | `id`, `title`, `kind`, `standing`, `summary` (its `EntryHead`, also what a peek shows), `path`, `quantities`, `sections`. |
| `Quantity` | A named number with a range and step. The page holds it: a `scrub` run sets it, a `ref` run shows it, a figure `bind` ties a prop to it (`{ harmonic: 'n' }` gives the figure `harmonic` and `onHarmonic`). |
| `Paragraph` | Runs: text, `{ tex }`, `{ peek }`, `{ mark }`, `{ note, cite? }`, `{ scrub }`, `{ ref, format? }`. |
| Blocks | `formula` (displayed TeX), `figure` (by registry name, with `props` and `bind`), `code`, `proof`, `timeline`, `steps` (paragraphs revealed one at a time), `table` (a head row and rows of cells, each cell runs; `rowHeads`), `exercise` (prompt, `hint`, `solution`, and an `answer`). |
| `Answer` | How an exercise is answered. **Typed**: `check` by name (`exact`, `numeric` built in; a page registers more, such as the math area's `expression`), `expect`, `tolerance`, `placeholder`, `options` for the checker; written in shorthand at the block's top level. **Choice**: `options` (id and prompt) and the expected id, drawn as a radio group. **Quantity**: a quantity of the entry within `tolerance` of `expect` when Check is pressed, however the reader set it. `answerOf` normalises. Every kind counts the same for progress. |
| `Book` | `chapters` in order and `heads`, a glossary of entries peeked at but not contained. `bookIndex` is what every page resolves peeks against. Progress is kept by `<chapter id>/<exercise id>`. |

Builders (`paragraph`, `tex`, `peek`, `mark`, `note`, `cite`, `scrub`, `ref`, `formula`, `figure`,
`code`, `proof`, `timeline`, `steps`, `table`, `exercise`, `choice`, `target`, `section`) keep an entry close to how it's
written. `validateEntry` names what would stop it rendering (TeX temml rejects, a figure, entry,
quantity or checker the page lacks, a choice whose expected option isn't listed, a repeated
exercise id, a ragged table or an empty cell, an empty paragraph); the book's
stories and `model/book.test.ts` hold every sample chapter to it.

## Verification

`npx vitest run src/library/compendium` for the model; `npm run typecheck`; `npm run build:storybook`
then `node scripts/compendium-stories.mjs <storybook url>` runs every Compendium play in headless
Chromium and takes screenshots at wide and narrow widths. The library rules in
`src/library/library.test.tsx` hold the area's CSS and TSX to the contract's variables.

## Next

- A figure face for the math explorers (they carry their own headings today), so a scene can sit
  in a page without breaking its outline.
- A glossary page drawn from the book's heads; search across a book.
