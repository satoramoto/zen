# Design

## Context

See proposal.md for why. What shapes the approach:

- The compendium's model is plain data with builders (`model/document.ts`), rendered by `Document`; an exercise today is one shape (`ExerciseBlock`: prompt, `check`, `expect`, `tolerance`, hint, solution) with checkers resolved by name from a registry the page passes. Progress is `Record<"<chapter>/<exercise>", boolean>` and the Book counts `exercisesIn(entry)`.
- The Fourier book is the pattern for a course: `book/fourier/chapters.ts` (entries), `figures.tsx` (the math components framed in `Figure`, keyed by name), `fourier.book.ts`; figures in `math/fourier/` take quantities as controlled props with `on<Prop>` and a pure `model/`.
- `math/calculator/expression.ts` already parses and compiles a bounded grammar (`compileExpressions`, `expressionTree`) for the wave calculator; it is the natural base for an expression checker.
- The compendium is React-only and unexported; the textbook packs and page layout are done (`textbook-page`, `textbook-theme` specs). `library.test.tsx` holds any new CSS to the contract's variables; the tier rules hold the new folders.
- Shared files (contract, themes, `.storybook/`) are not expected to change.

## Goals / Non-Goals

**Goals:**
- Grow the exercise model by two kinds without changing the typed kind's shape, so the Fourier and harmonic books are untouched.
- Keep every piece of mathematics out of the compendium: the expression checker lives in the math area and is registered by the book.
- Give the trig figures the same contract as the Fourier ones so a page binds them the same way.
- Decide, by doing, where a course lives.

**Non-Goals:**
- Exporting the compendium or a course from the package (a later change, once two books have shaped the model).
- Svelte renderers for the book or the figures (decided 2026-11-07: React only).
- Polar coordinates, vectors and complex numbers: beyond the high-school core; a ninth chapter could follow.
- A general CAS: the expression checker compares values at points, never symbolically.

## Decisions

**D1. Exercise kinds as a discriminated `answer` on the one block, not three blocks.**
`ExerciseBlock` gains `answer: Typed | Choice | Quantity` where `Typed` is the existing fields (`check`, `expect`, `tolerance`, `placeholder`) and the block's top-level `check`/`expect` stay as the typed shorthand the builders emit today (the model normalises both to `answer`). `Choice` is `{ options: { id, prompt: Run[] }[], expect: string }`; `Quantity` is `{ quantity: string; expect: number; tolerance: number }`. The `exercise()` builder keeps its signature; `choice()` and `target()` builders are added.
*Why:* one block kind means `exercisesIn`, progress keys, the plate's counts and the validator's repeated-id rule need no change; the renderer switches on `answer.kind`. Alternative: three block kinds (`exercise`, `choice`, `target`) would spread the counting logic across three places.

**D2. The quantity exercise reads the page's quantity at Check, not continuously.**
Checking is a press, like the typed kind, so a reader drags freely and commits; the verdict is `|value − expect| ≤ tolerance`. No auto-complete on reaching the target. *Why:* a continuous check would mark exercises done by accident while the reader explores. Alternative considered: live "you're there" feedback without marking done, deferred as a possible `hint` refinement.

**D3. The `expression` checker is in `math/calculator/checker.ts`, registered by the book's page.**
`expressionChecker(given, expect, { tolerance, variable?, at?, range? })` parses both with `expressionTree`, folds `√` to `sqrt`, `π` and `τ` to names, implicit multiplication where the parser allows, then compares: no variable, at one point; a variable, at 13 evenly spaced samples across `range` (default [0, 2π]) skipping points where either side is non-finite (tangent's poles), equal when every sample is within `tolerance` (default 1e-6 relative). Parse errors become `{ correct: false, feedback: "Couldn't read that: …" }`. The compendium's `ExerciseBlock.answer.typed` carries the extra options as `options?: Record<string, unknown>` passed through to the checker, so the model stays ignorant of them. *Why:* the parser exists and is tested; sampling is enough for a course. Alternative: a symbolic equality; out of scope.

**D4. A `table` block with cells of runs, drawn by a `Table` component.**
`TableBlock = { kind: 'table'; head: Run[][]; rows: Run[][][]; label: string; rowHeads?: boolean }`, builder `table(label, head, ...rows)`. The component renders `<table>` with `<caption>`, `<th scope="col">`, and `<th scope="row">` for the first cell when `rowHeads`; cells render through the same run renderer paragraphs use, so formulas, peeks and refs work. It sits in a `Wide`-less box with `overflow-x: auto`. *Why:* cells as runs cost nothing (the run renderer exists) and give live cells for free.

**D5. The trig figures are a family, `math/trig/`, with one pure model.**
`model/angle.ts` (degrees ↔ radians, neat multiples of π as TeX and text, reference angle, quadrant, coterminal), `model/triangle.ts` (solve right triangle from angle and hypotenuse; general triangle sides/angles from vertices; law of sines/cosines terms; SSA cases), `model/wave.ts` (y(x) for sin/cos/tan with A, B, C, D; period from B; inverse with restricted domain; residuals of data points). Each figure is plain SVG with the `useControlled` pattern from `math/fourier/useControlled.ts` for every quantity, a `DragPoint`-like handle with keyboard stepping, and a stops row where the spec names stops. Shared drawing bits (axes, the circle, an angle arc, a labelled length) go in `trig/parts.tsx`. *Why:* matches `fourier/`, keeps the maths testable, and the figures stay bindable.

**D6. The course lives at `compendium/book/trig/`, figures framed in `figures.tsx`, and that is the rule for courses.**
A course is content: `chapters/<n>-<slug>.ts` one per chapter (eight files rather than one long `chapters.ts`, since each will be a few hundred lines), `glossary.ts`, `figures.tsx`, `checkers.ts` (registers `expression` from the math area), `trig.book.ts`. Stories: `Compendium/Book` gains "Trigonometry"; `Math/Trig/<Figure>` one per figure. The README's folder table gets the rule: a course goes under `book/<course>/`; a primitive it lacks becomes its own change first, never a special case inside the course. *Why:* the compendium is unexported, so a separate repo cannot consume it yet; writing beside the Fourier book keeps both books on one model and one set of plays. When the compendium is exported, courses move out and this folder keeps the two sample books.

**D7. Degrees are the stored unit; radians are a view.**
Quantities for angles are in degrees (integers scrub well; 30°, 45°, 60° land exactly); the figures and `ref` formats show radians via the model's neat-π formatter where the chapter asks (`ref('theta', { as: 'radians' })` is not added; instead the figure shows both, and the text uses a `ref` in degrees). *Why:* keeps `Quantity` plain and the scrub integer-stepped. Open to revisiting if the Waves chapter needs radian scrubs: a `step` of π/12 as a decimal is workable.

## Risks / Trade-offs

- [Eight chapters is a lot of writing; the figures are seven new components] → Order the work so the primitives and figures land first with their own stories and tests (one PR), then the chapters in two PRs (1–4, 5–8), each runnable on its own; the book story can ship with fewer chapters valid at any point.
- [The expression checker's grammar surprises readers (`2sin x`, `sin²x`)] → Fold the common spellings before parsing (`²`→`^2`, `√`→`sqrt`, implicit multiplication between a number and a name); say in the placeholder what spelling is read; test the folds.
- [Sampling equality passes a wrong answer that agrees at the samples] → 13 samples at irrational-ish spacing across the range; good enough for a course, and the solution is shown anyway.
- [A quantity exercise marked by scrubbing to the number rather than dragging the figure] → That is allowed and fine: both are the reader moving the thing.
- [The tier rules or `library.test.tsx` reject a figure's colour] → Figures use `--hue-n`, `--text-n`, `--border` only, like `fourier/`.
- [Phone width: tables and the GeneralTriangle's readouts] → Tables scroll in their box (spec); readouts wrap under the drawing; plays assert zero overflow as the Fourier ones do.

## Open Questions

- Whether a ninth chapter (polar coordinates and vectors) is wanted after the eight land; it changes nothing above.
- Whether the Waves chapter wants a radian-stepped scrub (D7); decidable while writing chapter 4 without changing the specs.
