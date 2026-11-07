# textbook-page Specification

## Purpose
How a compendium page and a book lay out under a theme pack: the chapter plate, numbered sections, the reading column, figure and exercise cards, the scrub, and the book's ledger of contents.

## Requirements

### Requirement: The chapter plate

A page SHALL open with a plate: the chapter's number set large in the display face and coloured by the accent, beside its meta (the book, chapter n of N, how many figures and exercises), ruled off from the title below. A page outside a book SHALL show its path in place of the book's meta.

#### Scenario: A chapter in a book

- **WHEN** a book opens its third chapter
- **THEN** the plate reads 3 and "Chapter 3 of N", and counts the chapter's figures and exercises

### Requirement: Numbered sections and a reading column

Section headings SHALL carry their number (chapter.section) in the accent before the heading, and body text SHALL be set in the reading face at the lead size with generous leading and a measure of about 58 characters, with the page's sections parted by at least twice the paragraph gap.

#### Scenario: Reading face

- **WHEN** the blueprint pack is applied
- **THEN** paragraphs are set in the serif reading face while headings and labels stay in the grotesque

### Requirement: Figures and exercises as cards

A figure SHALL sit on the raised layer with a numbered caption in the accent and its source line, and an exercise SHALL sit on the raised layer with its number inside the prompt; both take their edge and shadow from the pack's materials, never from the component.

#### Scenario: Offset shadow

- **WHEN** the blueprint pack is applied
- **THEN** figures and exercises carry the pack's hard offset shadow, and under the console pack a faint edge and glow instead

### Requirement: The scrub

A scrub SHALL read as a highlighted pill in the action colour's tint, underlined in the accent, and SHALL remain a slider to assistive technology.

#### Scenario: Scrub under either pack

- **WHEN** either textbook pack is applied
- **THEN** the scrub shows the action tint and accent underline of that pack

### Requirement: The book's ledger

A book's contents SHALL be a ruled ledger: one row per chapter with its number, title and done count, the open chapter marked, and under it the open chapter's quantities with their live values.

#### Scenario: Live quantities

- **WHEN** a reader scrubs a quantity in the chapter
- **THEN** the ledger's row for that quantity shows the new value
