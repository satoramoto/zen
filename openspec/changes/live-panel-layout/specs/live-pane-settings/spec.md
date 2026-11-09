# live-pane-settings Spec Delta

## Purpose

Settings a pane kind declares, the sheet that edits a region’s, and the values a region carries to the app.

## ADDED Requirements

### Requirement: A pane kind declares its settings

A pane definition SHALL be able to declare settings as plain data, each a choice, a toggle, a number in a range or a pick of the app’s targets, with a label and a default, and a region SHALL carry its own values for them in the document.

#### Scenario: A region with no values yet
- **WHEN** a pane kind declares a setting and a region of it carries no value for it
- **THEN** the app’s `pane` receives the setting’s default

#### Scenario: A value the definition no longer declares
- **WHEN** a region carries a value for a setting its kind no longer declares
- **THEN** the value is kept in the document and not shown in the settings sheet

### Requirement: The settings sheet edits a region’s settings

A region’s tools SHALL open a sheet listing its kind’s settings with their current values, and each change SHALL send one configure intent with the region’s next settings; a kind with no settings SHALL offer no sheet.

#### Scenario: Choosing which tracks the strips show
- **WHEN** a person opens the track strips’ settings and unticks tracks until four of the eight are left
- **THEN** each change sends one configure intent, and once applied the strips show only those four

#### Scenario: A kind without settings
- **WHEN** a person opens the tools of a region whose kind declares no settings
- **THEN** there is no settings button

### Requirement: The live panes declare their settings

The Music live panes SHALL declare the settings their own props already allow (which tracks a pane shows, which pads or moves it offers), and the live views SHALL draw each pane from its region’s settings.

#### Scenario: The strips follow their settings
- **WHEN** a track strips region’s settings name two tracks
- **THEN** the strips draw those two tracks and their returns, and nothing else
