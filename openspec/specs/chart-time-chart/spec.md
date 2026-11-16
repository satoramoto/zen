# chart-time-chart Specification

## Purpose
A chart of values over time that wears the pack it is drawn in, for dashboards: several series on one axis, a crosshair that reads them as text, and an accessible summary.

## Requirements

### Requirement: Series on one time axis in the pack's colours

A TimeChart SHALL draw each of its series on one time axis, series n in the pack's hue n, as a line, an area, a baseline or a histogram.

#### Scenario: Two series in their hues
- **WHEN** a TimeChart is drawn with two line series
- **THEN** each series is drawn, the first in hue 1 and the second in hue 2

### Requirement: A baseline series shows which side of a value it is on

A baseline series SHALL be drawn in the success colour above its base value and the danger colour below it.

#### Scenario: Above and below the base
- **WHEN** a baseline series crosses its base value
- **THEN** the part above is drawn in success and the part below in danger

### Requirement: Rebased to percent change

With rebasing on, every series SHALL be drawn as its percent change from its own first point.

#### Scenario: Two coins from one start
- **WHEN** two series that start at different values are drawn rebased
- **THEN** both start at 0% and the readout gives each one's change in percent

### Requirement: The crosshair reads every series as text

Pointing at the chart SHALL show, as text, each series' name and value at the time pointed at.

#### Scenario: Reading a moment
- **WHEN** the pointer moves over the chart
- **THEN** the readout names that moment and lists each series' value there

### Requirement: An accessible summary

The chart SHALL give, as text for assistive technology, each series' last value and its change over the span.

#### Scenario: A screen reader's view
- **WHEN** a TimeChart is drawn
- **THEN** a summary lists each series with its last value and change

### Requirement: Too few points says so

A chart whose series have fewer than two points SHALL show a message instead of an empty plot.

#### Scenario: One reading so far
- **WHEN** every series has fewer than two points
- **THEN** the chart shows its empty message and draws no plot

### Requirement: Follows the theme

A drawn chart SHALL take the new colours when its scope's pack or mode changes, without being redrawn by its host.

#### Scenario: The system turns dark
- **WHEN** the scope around a drawn chart turns dark
- **THEN** the chart's scale text, grid and series take the dark colours

### Requirement: Reference lines and markers

A TimeChart SHALL draw each reference line it is given at its value with its label and tone, and each marker at its time on its series with its label and tone; a line outside the values in view SHALL be named in words with the side it lies on.

#### Scenario: A break-even line and an event
- **WHEN** a chart is given a reference line and a marker
- **THEN** the line is drawn at its value with its label, and the marker on its series at its time

### Requirement: Spans window the points

A TimeChart given spans SHALL show the points inside the chosen span from the points it already has, and rebase to the first point inside it.

#### Scenario: The last week
- **WHEN** the span is switched to one week
- **THEN** only the last week is in view and rebased series start at 0% at its first point

### Requirement: A legend of the series

A TimeChart SHALL list each series in a legend with its name, its latest value and its change (rebased, its change alone), and a series given a link SHALL link from its name.

#### Scenario: A coin's line links to its page
- **WHEN** a series has a link
- **THEN** its legend name is a link to it
