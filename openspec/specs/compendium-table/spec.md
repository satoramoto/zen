# compendium-table Specification

## Purpose
A table in an entry: a head row and rows of cells, each cell a run of the paragraph vocabulary, drawn in the reading column so a page can lay out the special-angle values or the signs by quadrant.

## Requirements

### Requirement: A table block

An entry MAY hold a table block: a head row of cells, rows of cells, and a label. Each cell SHALL be a list of runs with the paragraph's vocabulary (text, inline formulas, peeks, refs of quantities), so a cell can hold `√3/2` typeset and a cell can show a quantity's live value. The page SHALL draw it as a real table with a caption from the label, column heads marked as heads, and the first column marked as a row head when the block says so.

#### Scenario: Special angles

- **WHEN** a table has heads θ, sin θ, cos θ, tan θ and a row for 60° whose cells are formulas
- **THEN** the page draws a four-column table whose cells typeset the formulas, with "θ" as the row head

#### Scenario: A live cell

- **WHEN** a cell holds a ref of the quantity `theta` and the reader scrubs it
- **THEN** the cell shows the new value

### Requirement: A table's shape is validated

The entry validator SHALL report a table whose rows differ in length from its head, and one with an empty cell.

#### Scenario: A ragged table

- **WHEN** a table's head has four cells and a row has three
- **THEN** validation names the entry, the section and the row

### Requirement: A table at a narrow width

A table wider than the reading column SHALL scroll sideways inside its own box; it SHALL never widen the page.

#### Scenario: Phone width

- **WHEN** the special-angle table is drawn at 390 px
- **THEN** the page has no horizontal overflow and the table can be scrolled
