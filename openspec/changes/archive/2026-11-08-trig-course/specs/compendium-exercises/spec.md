# Spec Delta

## Purpose
The kinds of exercise a compendium page can pose and check, how each is answered, and how a page extends the checking of typed answers with its own checkers.

## ADDED Requirements

### Requirement: A typed exercise

An exercise MAY ask for a typed answer. The page SHALL check it with the checker the block names, from the page's registry with the built-in `exact` and `numeric` checkers beneath, and SHALL show the verdict and any feedback the checker gives. A checker the page lacks SHALL be reported as a verdict on the page and as a problem by the entry validator.

#### Scenario: A numeric answer within tolerance

- **WHEN** an exercise expects 0.866 with a tolerance of 0.01 and the reader types 0.87
- **THEN** the exercise is marked correct and its progress is kept

### Requirement: An expression checker

A page MAY register an `expression` checker that reads the reader's answer and the expected answer as expressions in a bounded grammar and marks them correct when they are equal: at one point when there is no variable, or at a set of sample points across the block's range when there is one. An answer the grammar cannot read SHALL be marked wrong with feedback saying so, never thrown.

#### Scenario: The grammar

- **WHEN** an answer uses numbers, `+ − × ÷ ^`, parentheses, `pi`, `sqrt`, `sin`, `cos`, `tan` and the block's variable
- **THEN** it is read; anything else is reported as unreadable

#### Scenario: An exact value in two spellings

- **WHEN** an exercise expects `sqrt(3)/2` and the reader types `√3/2` or `sqrt(3) / 2` or `0.8660254`
- **THEN** each is marked correct

#### Scenario: An identity in a variable

- **WHEN** an exercise expects `1 - sin(x)^2` over x in [0, 2π] and the reader types `cos(x)^2`
- **THEN** the answer is marked correct, and `cos(x)` is marked wrong

### Requirement: A choice exercise

An exercise MAY list options, each with an id and a prompt of runs. The page SHALL draw them as a radio group under the prompt, SHALL mark the exercise correct when the chosen option is the expected one, and SHALL keep the choice until the reader changes it. The validator SHALL report an exercise whose expected option is not among its options.

#### Scenario: Choosing the quadrant

- **WHEN** an exercise lists four quadrants and expects the third, and the reader chooses the third and presses Check
- **THEN** the exercise is marked correct and the chapter's done count rises by one

### Requirement: A quantity exercise

An exercise MAY be answered by a quantity of the entry: it names the quantity and a target value with a tolerance. The page SHALL mark it correct, when the reader presses Check, if the quantity's current value is within the tolerance of the target, whether the reader set it by scrubbing or through a figure bound to it. The validator SHALL report a quantity the entry lacks.

#### Scenario: Drag the point to where sine is one half

- **WHEN** an exercise targets the angle 30° within 2°, and the reader drags the unit-circle point until the ledger reads 31° and presses Check
- **THEN** the exercise is marked correct

#### Scenario: Not yet there

- **WHEN** the same reader checks at 45°
- **THEN** the exercise is marked wrong and the hint, if any, is offered

### Requirement: Every kind counts the same

The Book's done counts, the chapter plate's exercise count, progress keys and the entry validator's repeated-id rule SHALL treat typed, choice and quantity exercises alike.

#### Scenario: A chapter of mixed kinds

- **WHEN** a chapter has one typed, one choice and one quantity exercise and the reader completes the choice one
- **THEN** the ledger reads 1/3 for that chapter
