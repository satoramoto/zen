# live-surface-editing Spec Delta

## Purpose

Perform and edit modes of the surface an app composes its DAW on: every edit as one intent the app applies, undo and redo as the app’s, and the visual state zen keeps.

## ADDED Requirements

### Requirement: Every edit leaves as one intent

Every change a person makes through the surface SHALL leave it as exactly one intent naming the edit and its target: choosing, adding, renaming, duplicating or removing a tab; adding, removing, moving (left, right, up, down), retitling or rebinding a region; and undo and redo.

#### Scenario: Choosing a tab
- **WHEN** a person chooses the third tab
- **THEN** the surface sends one intent to select that tab and shows it only once the app’s document opens it

#### Scenario: Moving a region
- **WHEN** a person moves a region one place to the right in edit mode
- **THEN** the surface sends one move intent naming the tab, the region and the direction

#### Scenario: Adding from the palette
- **WHEN** a person adds a kind from the palette to a row
- **THEN** the surface sends one add intent naming the tab, the kind and where it goes, and the app picks the new instance’s id

#### Scenario: Rebinding a region
- **WHEN** a person binds a region to a fixed target from the targets the app offers
- **THEN** the surface sends one bind intent naming the tab, the region and the fixed binding

#### Scenario: Renaming a tab
- **WHEN** a person renames a tab and confirms
- **THEN** the surface sends one rename intent with the new title, and cancelling sends nothing

### Requirement: Undo and redo are the app’s

The surface SHALL offer undo and redo only when the app says each is possible, and SHALL send them as intents without keeping any history of its own.

#### Scenario: Undo the app can do
- **WHEN** the app says undo is possible and a person presses undo
- **THEN** the surface sends one undo intent

#### Scenario: Nothing to undo
- **WHEN** the app says undo is not possible
- **THEN** undo is shown disabled and pressing it sends nothing

### Requirement: Intents can be applied without a store

Zen SHALL provide a pure function that returns the next document for a document and an intent, keeping no state, so an app or a story without a store of its own can apply what the surface sends.

#### Scenario: Applying the surface’s own intents
- **WHEN** a story applies every intent the surface sends to the document it gives back
- **THEN** each edit appears in the surface as soon as it is made

#### Scenario: An intent that can’t apply
- **WHEN** an intent names a tab or region the document doesn’t hold
- **THEN** the function returns the document unchanged

### Requirement: Zen keeps only visual state

The surface SHALL keep edit mode, the region being edited and whether the palette is open as its own state when the app passes none of them, SHALL follow the app’s value for each one the app passes, and SHALL never write any of them into the document.

#### Scenario: Edit mode the surface keeps
- **WHEN** the app passes no edit mode and a person turns editing on
- **THEN** every region shows its edit frame and the document is unchanged

#### Scenario: Edit mode the app keeps
- **WHEN** the app passes edit mode off and a person turns editing on
- **THEN** the surface asks the app to turn editing on and stays in perform mode until the app does

#### Scenario: Perform mode is played, not edited
- **WHEN** the surface is in perform mode
- **THEN** no region shows an edit frame, the palette is closed and every pane takes its own input
