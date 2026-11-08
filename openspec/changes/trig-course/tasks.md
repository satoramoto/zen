# Tasks

## 1. Exercise kinds and the table (compendium primitives; PR 1 with group 2)

- [x] 1.1 Model: `ExerciseBlock.answer` (typed | choice | quantity) with the typed shorthand normalised, `choice()` and `target()` builders, `TableBlock` and `table()`; `document.test.ts` covers normalisation and `exercisesIn` counting all three kinds
- [x] 1.2 Validator: choice's expected option must be listed, quantity exercise's quantity must exist, table rows match the head and no empty cell; `validate.test.ts` names each problem
- [x] 1.3 `Exercise` component draws the choice kind as a radio group and the quantity kind as a Check against the page's quantity (D2); stories with plays for each kind, done through the existing verdict and progress path
- [x] 1.4 `components/Table/` draws a table block (caption, column heads, optional row heads, cells through the run renderer, sideways scroll in its box); story with a formula cell and a live ref cell; CSS reads contract variables only (`npx vitest run src/library/library.test.tsx src/library/tiers.test.ts`)
- [x] 1.5 `Document` renders the table block and passes the quantity's value to a quantity exercise; `Book` done counts and plate counts verified for a mixed chapter in `book.test.ts` and the Book story's play
- [x] 1.6 Compendium README: the model table gains `table` and the exercise kinds; the folder rule for courses (D6)

## 2. The expression checker (math area; PR 1)

- [x] 2.1 `math/calculator/checker.ts`: `expressionChecker` per D3 with the spelling folds; `checker.test.ts` covers the two spec scenarios, tangent's poles, a parse error's feedback and a wrong identity
- [x] 2.2 Export it from `math/calculator/index.ts`; the harmonic sample book registers it in one exercise so the compendium's `Checker` contract is exercised in a story play

## 3. The trig figures (math area; PR 2)

- [ ] 3.1 `math/trig/model/`: `angle.ts`, `triangle.ts`, `wave.ts` with unit tests (neat-π formatting, reference angle and quadrant, right-triangle solve, general-triangle sides/angles and SSA cases, wave period and inverse domain, data residuals)
- [ ] 3.2 `trig/parts.tsx`: shared axes, circle, angle arc, labelled length and a keyboard-steppable drag handle; used by every figure below
- [ ] 3.3 `ArcWrap` with story and play (set one radian, read 57.3°)
- [ ] 3.4 `RightTriangle` with stops and play (lengthen the hypotenuse, ratios unchanged)
- [ ] 3.5 `UnitCircle` with snapping, guide line and play (drag to 210°: signs and reference angle)
- [ ] 3.6 `WaveGraph` with sine/cosine/tangent, the circle beside it, inverse mode and data mode; plays for halving the period and fitting six points
- [ ] 3.7 `IdentitySquares` and `AngleSum` with plays (areas sum to 1.00 everywhere; the two lengths add up)
- [ ] 3.8 `GeneralTriangle` with the ambiguous-case stops and play (ratios agree after a drag)
- [ ] 3.9 `math/index.ts` and `math/README.md` list the family; `npm run typecheck`, `npx vitest run src/library/math/trig`, `npm run build:storybook` pass; every figure checked in a browser at 390 px

## 4. The course, chapters 1–4 (content; PR 3)

- [ ] 4.1 `book/trig/`: `glossary.ts`, `figures.tsx` (the seven figures framed with titles and source lines), `checkers.ts` (registers `expression`), `trig.book.ts`; `Compendium/Book` story "Trigonometry" renders with the chapters so far valid under `validateEntry` (a `trig-book.test.ts` like `fourier-book.test.ts`)
- [ ] 4.2 Chapter 1, Angles and turns: ArcWrap bound to the angle; radians as a length; coterminal angles; exercises: numeric (degrees to radians), choice (which quadrant), quantity (set one radian)
- [ ] 4.3 Chapter 2, Right triangles: RightTriangle bound to angle and hypotenuse; the three ratios named from the figure; the special triangles as stops and a table; exercises: expression (an exact ratio), numeric (solve a side)
- [ ] 4.4 Chapter 3, The unit circle: UnitCircle bound to theta; signs by quadrant as a table; reference angles; the special-angle table with formula cells; exercises: quantity (drag to where sin θ = ½), choice (sign of tan in quadrant II), expression (cos 150°)
- [ ] 4.5 Chapter 4, Waves: WaveGraph bound to amplitude, period, shift and midline with the circle beside; cosine as a shifted sine; tangent's poles; exercises: numeric (period from B), quantity (match a drawn target wave), expression (write the equation)
- [ ] 4.6 `scripts/compendium-stories.mjs` runs the Trigonometry plays and screenshots its chapters in both packs; zero narrow overflow

## 5. The course, chapters 5–8 (content; PR 4)

- [ ] 5.1 Chapter 5, Identities: IdentitySquares and AngleSum bound; Pythagorean, cofunction, sum and double angle, each felt in the figure first; exercises: expression (an identity in x), choice, numeric
- [ ] 5.2 Chapter 6, Undoing: WaveGraph inverse mode; the restricted domains; solving sin θ = k on an interval with the UnitCircle guide line; exercises: quantity (find the second solution), numeric, expression
- [ ] 5.3 Chapter 7, Any triangle: GeneralTriangle bound; law of sines from the common ratio, law of cosines from the terms, the ambiguous case from the stops, area; exercises: numeric (a side), numeric (an angle), choice (how many triangles)
- [ ] 5.4 Chapter 8, Periodic things: WaveGraph data mode with tide, Ferris-wheel and daylight data; fitting by scrubbing; exercises: quantity (fit within the band), expression (the model), numeric (a predicted value)
- [ ] 5.5 Every chapter's exercises carry a hint and a solution; a test walks the book and finds all five checking styles (spec: One of each) and a mark opening every theorem paragraph
- [ ] 5.6 Full checks: `npm run typecheck`, `npm test`, `npm run build:storybook`, the plays in both packs with screenshots reviewed by eye; README's course rule and `docs/` pointer updated

## Workflow follow-up

- Archive with `/opsx:archive` after the fourth PR merges, so the four specs land in `openspec/specs/`.
