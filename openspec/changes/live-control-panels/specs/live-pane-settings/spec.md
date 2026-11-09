# live-pane-settings Spec Delta

## MODIFIED Requirements

### Requirement: A pane kind declares its settings

A pane definition SHALL be able to declare settings as plain data, each a choice, a toggle, a number in a range, a pick of the app’s targets, or plain data the pane edits itself, with a label and a default, and a region SHALL carry its own values for them in the document; a plain-data setting SHALL reach the pane and SHALL never be listed in the settings sheet.

#### Scenario: A region with no values yet
- **WHEN** a pane kind declares a setting and a region of it carries no value for it
- **THEN** the app’s `pane` receives the setting’s default

#### Scenario: A value the definition no longer declares
- **WHEN** a region carries a value for a setting its kind no longer declares
- **THEN** the value is kept in the document and not shown in the settings sheet

#### Scenario: A plain-data setting
- **WHEN** a pane kind declares a plain-data setting and a region carries a value for it
- **THEN** the pane receives the value and the settings sheet doesn’t list it
