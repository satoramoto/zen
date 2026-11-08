# trig-course Specification

## Purpose
The trigonometry book: a high-school course in the compendium's interactive style, where every idea is felt through a figure before it is stated, and every chapter is checked.

## Requirements

### Requirement: The course and its chapters

The book SHALL be titled Trigonometry with eight chapters in this order, each a valid entry whose summary says what it is for in one or two sentences a fifteen-year-old would read: Angles and turns, Right triangles, The unit circle, Waves, Identities, Undoing, Any triangle, Periodic things.

#### Scenario: The book opens

- **WHEN** the Trigonometry book story opens
- **THEN** the ledger lists the eight chapters in order with their done counts and the first chapter's plate reads 1 of 8

#### Scenario: What each chapter covers

- **WHEN** the chapters are read in order
- **THEN** they cover degrees, radians, standard position and coterminal angles; the three ratios, the special triangles and solving a right triangle; sine and cosine as coordinates, signs by quadrant, reference and special angles; circle to wave with amplitude, period, phase shift and midline, cosine and tangent; the Pythagorean, cofunction, sum and double-angle identities; inverse functions, restricted domains and equations on an interval; the laws of sines and cosines, the ambiguous case and area; fitting a sinusoid to tides, a Ferris wheel and daylight

### Requirement: Every chapter is felt before it is told

Every chapter SHALL declare at least one quantity the text scrubs and a figure binds to, and the first figure of every chapter SHALL come before the chapter's first formula, so the reader has moved the thing before it is written down.

#### Scenario: The sentence and the drawing agree

- **WHEN** a reader scrubs the angle in a sentence of The unit circle
- **THEN** the unit-circle figure's point moves to that angle, and the ledger shows the same angle

### Requirement: Every chapter is checked

Every chapter SHALL end with at least two exercises, and the book as a whole SHALL use every exercise kind the page offers: typed (numeric, exact and expression), choice and quantity. Every exercise SHALL have a hint and a solution.

#### Scenario: One of each

- **WHEN** the book's chapters are walked
- **THEN** at least one exercise of each of the five checking styles is found, and none lacks a hint or a solution

### Requirement: Written in its own words, for its reader

The text SHALL be written for a reader meeting the ideas for the first time: short paragraphs, the everyday meaning before the formal one, radians introduced as a length not a convention, and no claim marked beyond its standing. It SHALL reference no copyrighted course text and reproduce none.

#### Scenario: A mark on every claim

- **WHEN** a paragraph states a theorem (the Pythagorean identity, the law of cosines)
- **THEN** its first run is a standing mark

### Requirement: The course is held by the plays

The Compendium plays SHALL include the Trigonometry book, scrub a quantity in each chapter and see its figure follow, complete one exercise of each kind, and screenshot every chapter in both textbook packs at wide and phone widths with zero horizontal overflow.

#### Scenario: The runner

- **WHEN** `scripts/compendium-stories.mjs` runs against a built Storybook
- **THEN** the Trigonometry plays pass and eight chapter screenshots per pack are written
