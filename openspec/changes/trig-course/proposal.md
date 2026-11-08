# Proposal

## Why

The compendium passed its litmus test with one book: seven chapters of Fourier series, each driven by a figure the reader scrubs. A high-school trigonometry course is the next test, and a harder one: it is longer (eight chapters), its readers are younger, its exercises are of more kinds (choose an answer, give an exact value, drag a point into place, read a table), and its figures are the ordinary furniture of a maths classroom (a unit circle, a right triangle, a wave with four knobs). Writing it shows which primitives the book framework still lacks, and settles where a course lives.

## What Changes

- **Three new book primitives** in the compendium model, each with its component, stories and validator rule:
  - a `table` block: rows of runs with a head row, for the special-angle values and the quadrant signs;
  - a choice exercise: an exercise whose answer is one of listed options, drawn as radio buttons, checked by option id;
  - a quantity exercise: an exercise answered by setting a quantity (by scrubbing it, or by dragging the bound figure) into a target range, so "drag the point to where sin θ = ½" is checkable. Progress and the Book's done counts treat both like the existing typed exercises.
- **An `expression` checker** from the math area's bounded expression parser, registered by a page: the reader's answer (`sqrt(3)/2`, `1/2`, `sin(x)^2`) is equal to the expected expression numerically, at the point or over the range the block names. The compendium keeps none of the mathematics; the book registers the checker.
- **A `trig` family of figures** in the math area, `src/library/math/trig/`: a pure model (`model/`, unit tests) and plain-SVG figures taking every quantity as a controlled prop with an `on<Prop>` callback, like `fourier/`: ArcWrap (radians as a radius wrapped along the circle), RightTriangle (a draggable vertex, the three ratios), UnitCircle (the point at θ, its two legs, the tangent segment, signs by quadrant, degrees and radians), WaveGraph (y = A·sin(B(x − C)) + D and the cosine and tangent, with the circle beside it; an inverse mode with the restricted domain; data points to fit), IdentitySquares (sin² + cos² = 1 as two squares on a unit hypotenuse), AngleSum (the two-triangle picture of sin(α + β)), GeneralTriangle (three draggable vertices, the law of sines' common ratio, the law of cosines' terms).
- **The course itself**, `src/library/compendium/book/trig/`: eight chapters (angles and radians; right triangles; the unit circle; graphs of sine, cosine and tangent; identities; inverse functions and equations; any triangle; modelling periodic things), a glossary of heads, every chapter with bound quantities, the figures framed in a registry, and exercises of every kind the page can check. It joins the Fourier book under `Compendium/Book` and runs through the same plays and screenshots.
- **Where a course lives, decided**: a course is content, not primitives, so it goes under `compendium/book/<course>/` beside the Fourier book, with its figures in `math/<family>/`, until the compendium is exported (a later change). A course never edits a primitive; what it needs and lacks becomes a primitive change first, as this one does.

Nothing is removed and nothing breaks: the Fourier and harmonic books render unchanged, and the existing exercise kinds keep their shape.

## Capabilities

### New Capabilities
- `compendium-exercises`: the kinds of exercise a compendium page can pose and check: typed (existing, restated as the baseline), choice, and quantity; and how a checker registry extends the typed kind (the expression checker).
- `compendium-table`: a table block in an entry: a head row and rows of runs, drawn in the reading column and valid under the entry validator.
- `math-trig`: the trigonometry figures: what each draws, which quantities it takes and reports, and what a reader can do to it by hand.
- `trig-course`: the trigonometry book: its chapters in order, what each chapter's reader can feel through a figure, what each chapter checks, and the plays and screenshots that hold it.

### Modified Capabilities
- (none: `textbook-page` and `textbook-theme` keep their requirements; the new blocks take their look from the same contract variables)

## Impact

- `src/library/compendium/model/` (`document.ts`, `exercise.ts`, `validate.ts`, tests), `components/Exercise/`, a new `components/Table/`, `layout/Document/` (draws the new block and exercise kinds), `layout/Book/` (done counts include the new kinds), and the compendium README.
- `src/library/math/trig/` is new; `src/library/math/calculator/expression.ts` is read, not changed, by the checker; `math/README.md` and `math/index.ts` list the family.
- `src/library/compendium/book/trig/` is new; `scripts/compendium-stories.mjs` learns the second book's story ids.
- Shared files touched, in their own first commit per AGENTS.md: none expected (no contract, theme or Storybook configuration change). If the ledger needs a token the contract lacks, that is a separate small change.
- The library tests (`library.test.tsx`, `tiers.test.ts`) hold the new CSS to the contract; the tier baseline may only go down.
