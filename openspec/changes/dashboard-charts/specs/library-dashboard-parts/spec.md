# library-dashboard-parts Spec Delta

## Purpose

The small parts a dashboard is made of, generic and drawn in every renderer: a value on a rail, a sparkline, ranked bars, a strip of figures and a titled panel.

## ADDED Requirements

### Requirement: A track places a value against a mark

A Track SHALL place its value on a rail, as a ratio on a log scale around a mark in the middle or as a share from nothing to all, with a tone and a text name.

#### Scenario: Above the mark
- **WHEN** a ratio Track is given a value of 2 with a range of a quarter to four times the mark
- **THEN** its dot sits three quarters along, the fill runs from the mark to the dot, and it reads as good

### Requirement: A sparkline draws values small

A Sparkline SHALL draw its values as a small line, toned by whether the last value is above the first, with a text name.

#### Scenario: A rising line
- **WHEN** a Sparkline is drawn with rising values
- **THEN** the line reads as up and its name says so

### Requirement: Ranked bars against the largest

A BarList SHALL draw each item's bar as a share of the largest item's value, never narrower than a visible sliver, with its name, value and note.

#### Scenario: Half the largest
- **WHEN** a BarList has items of 10 and 5
- **THEN** the second bar is half the width of the first

### Requirement: A strip of figures

A FigureStrip SHALL show each figure's label, value and note, and may lead with its first.

#### Scenario: Five figures
- **WHEN** a FigureStrip is given five figures
- **THEN** each is drawn as a term and its value with its note

### Requirement: A titled panel

A Panel SHALL draw its title as a heading of the level given, an aside beside it, and its body, or its empty message when it has no body.

#### Scenario: An empty panel
- **WHEN** a Panel has no body and an empty message
- **THEN** the message is drawn under the heading
