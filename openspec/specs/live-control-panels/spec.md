# live-control-panels Specification

## Purpose

The control panel pane: a grid of the person’s own controls bound to the app’s parameters, values in and moves out, built in place while the surface edits.

## Requirements

### Requirement: A control panel draws the app’s parameters

A control panel SHALL draw a grid of cells, each holding one control (a fader, a knob, a toggle, a button, a pad or an XY) bound to one of the app’s parameters (an XY to two), showing the parameter’s label and the value the app gives for it, in the parameter’s range and unit.

#### Scenario: A fader shows the app’s value
- **WHEN** the app lists a filter cutoff from 20 Hz to 20 kHz and gives its value as 1.2 kHz
- **THEN** the fader bound to it stands at 1.2 kHz and reads `1.20 kHz` under its label

#### Scenario: A control with no parameter yet
- **WHEN** a cell holds a knob not yet bound to a parameter
- **THEN** the knob is drawn dimmed, says it has no parameter, and moves nothing

#### Scenario: A parameter the app no longer lists
- **WHEN** a control is bound to a parameter id the app’s catalogue no longer has
- **THEN** the control says its parameter is missing and moves nothing, and the rest of the panel plays

### Requirement: Controls are built in place

While the surface is editing and the tab is unlocked, a control panel SHALL show its grid, let a person add a control to an empty cell, move and resize a control on the grid (by pointer, or arrows and Shift+arrows), and set a control’s kind, parameter and label or remove it, sending the panel’s whole next cells as one change each time and never overlapping two controls.

#### Scenario: Adding a knob
- **WHEN** a person picks a knob for an empty cell
- **THEN** one change is sent with a knob in that cell, and once applied the knob is there, waiting for a parameter

#### Scenario: Binding a parameter
- **WHEN** a person opens a fader’s sheet and picks the feedback
- **THEN** one change is sent with the fader bound to it, and the sheet offers only continuous parameters

#### Scenario: Moving onto another control
- **WHEN** a person moves a control toward a cell another control holds
- **THEN** the control stops at the last free cell on its way and the two never overlap

#### Scenario: Played, not built
- **WHEN** the surface is not editing, or the tab is locked
- **THEN** the panel shows no grid, no empty cells and no sheets, and every control plays

### Requirement: The panel’s grid is a setting

A control panel’s columns and rows SHALL be settings in its settings sheet, and its cells SHALL be a plain-data setting it edits itself.

#### Scenario: A wider grid
- **WHEN** a person sets the panel to twelve columns
- **THEN** the cells keep their places and the new columns are empty

#### Scenario: A smaller grid
- **WHEN** a person sets fewer columns than a control reaches
- **THEN** that control is drawn clipped to the grid and marked, and nothing is removed
