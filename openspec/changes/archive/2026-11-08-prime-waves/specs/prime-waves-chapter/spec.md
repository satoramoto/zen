# Spec Delta

## Purpose
A one-chapter book that re-tells, in its own words, a video's picture of primes as waves, lets the reader drive every picture, and says plainly which patterns come from the primes, which from simple fractions, and which from the screen.

## ADDED Requirements

### Requirement: The chapter follows the video's pictures

The book SHALL be titled Prime waves with one chapter whose sections follow the video's order: a prime as a wave in a boundary; many primes, and wrapping the boundary into a circle; the marks that never meet; thousands of waves as rings; the gaps as a spectrum; from one dimension to two and three; the flat plane and the sphere; and what the video claims about information. Every section after the first SHALL include the figure it describes, bound to a quantity the text scrubs.

#### Scenario: Reading in order

- **WHEN** the Prime waves book opens
- **THEN** its sections appear in that order, each with its figure, and scrubbing the prime count in a section's text redraws that section's figure

### Requirement: Every claim carries its standing

Each paragraph that makes a claim SHALL open with a standing mark: established for arithmetic facts (marks never meet; gaps are even after 3; rings at halves), interpretation for the video's framing (primes as a wave field), and speculation for its claims about infinite information and a simulated universe. Where a pattern comes from sampling or from the shape it is wrapped on, the text SHALL say so next to the figure that shows it.

#### Scenario: The speculation is marked

- **WHEN** the section on information is read
- **THEN** the paragraphs on infinite information and simulation open with the speculation mark

### Requirement: Credit and own words

The chapter SHALL credit the video by title, channel and link in a citation, and SHALL be written in its own words; it SHALL quote no more than a short phrase of the video and reproduce none of its images.

#### Scenario: The citation

- **WHEN** the first section is read
- **THEN** a citation names the video, its channel and its address

### Requirement: The chapter is checked

The chapter SHALL end at least three sections with an exercise, using at least one typed, one choice and one quantity exercise, each with a hint and a solution, and the chapter SHALL validate against its book with no missing figure, entry, quantity or checker.

#### Scenario: Why six

- **WHEN** the reader answers the choice exercise on why gaps of 6 are the commonest
- **THEN** the right option is that a gap of 6 can start from a prime of either kind (one more or one less than a multiple of 6), while gaps of 2 or 4 can start from only one kind

### Requirement: Held by the plays

The Compendium plays SHALL open the Prime waves book, scrub a quantity in each section with a figure and see the figure change, complete one exercise of each kind, and screenshot the chapter in both textbook packs at wide and phone widths with no horizontal overflow; the Math/Primes stories SHALL play in the same run.

#### Scenario: The runner

- **WHEN** `scripts/compendium-stories.mjs` runs against a built Storybook
- **THEN** the Prime waves and Math/Primes plays pass and the chapter screenshots are written with zero overflow
