# live-pane-settings Specification

## Purpose

Settings a pane kind declares, the sheet that edits a region’s, and the values a region carries to the app.

## Requirements

### Requirement: A pane kind declares its settings

A pane definition SHALL be able to declare settings as plain data, each a choice, several of a set of choices, a toggle, a number in a range, a pick of the app’s targets, or plain data the pane edits itself, with a label and a default, and a region SHALL carry its own values for them in the document; a plain-data setting SHALL reach the pane and SHALL never be listed in the settings sheet.

#### Scenario: A region with no values yet
- **WHEN** a pane kind declares a setting and a region of it carries no value for it
- **THEN** the app’s `pane` receives the setting’s default

#### Scenario: A value the definition no longer declares
- **WHEN** a region carries a value for a setting its kind no longer declares
- **THEN** the value is kept in the document and not shown in the settings sheet

#### Scenario: A plain-data setting
- **WHEN** a pane kind declares a plain-data setting and a region carries a value for it
- **THEN** the pane receives the value and the settings sheet doesn’t list it

#### Scenario: Several of a set of choices
- **WHEN** a pane kind declares a setting that picks several of its options and a person ticks a second one in the settings sheet
- **THEN** one configure intent is sent with both values, in the options’ order

### Requirement: The settings sheet edits a region’s settings

A region’s tools SHALL open a sheet listing its kind’s settings with their current values, and each change SHALL send one configure intent with the region’s next settings; a kind with no settings SHALL offer no sheet.

#### Scenario: Choosing which tracks the strips show
- **WHEN** a person opens the track strips’ settings and unticks tracks until four of the eight are left
- **THEN** each change sends one configure intent, and once applied the strips show only those four

#### Scenario: A kind without settings
- **WHEN** a person opens the tools of a region whose kind declares no settings
- **THEN** there is no settings button

### Requirement: A value that no longer fits reads as the default

A region’s value that its setting no longer allows SHALL reach the pane as the setting’s default (a choice that is no longer an option, a toggle that isn’t on or off, a number that isn’t one), a number outside its range SHALL reach it held to the range, a pick of several SHALL keep only the values still offered, and the document SHALL keep the value it holds until a person changes it.

#### Scenario: An option that is gone
- **WHEN** a region carries a text size its kind no longer offers, and a list that is no longer one of the options
- **THEN** the pane receives the default text size and only the lists still offered

#### Scenario: A number out of range
- **WHEN** a region carries forty lines for a setting that allows one to twelve, and a toggle that is neither on nor off
- **THEN** the pane receives twelve lines and the toggle’s default
- **AND** the document still holds the forty
