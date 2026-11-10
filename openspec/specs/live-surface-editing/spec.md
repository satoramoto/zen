# live-surface-editing Specification

## Purpose

Perform and edit modes of the surface an app composes its DAW on: every edit as one intent the app applies, undo and redo as the app’s, and the visual state zen keeps.

## Requirements

### Requirement: Every edit leaves as one intent

Every change a person makes through the surface SHALL leave it as exactly one intent naming the edit and its target: choosing, adding, renaming, duplicating, removing, locking or unlocking a tab; adding, removing, moving (left, right, up, down), docking, retitling, rebinding or configuring a region; resizing a split; turning edit mode on or off; and undo and redo.

#### Scenario: Choosing a tab
- **WHEN** a person chooses the third tab
- **THEN** the surface sends one intent to select that tab and shows it only once the app’s document opens it

#### Scenario: Moving a region
- **WHEN** a person moves a region one place to the right in edit mode
- **THEN** the surface sends one move intent naming the tab, the region and the direction

#### Scenario: Adding from the palette
- **WHEN** a person adds a kind from the palette beside a region
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

Zen SHALL provide a pure function that returns the next document for a document and any intent the surface sends, keeping no state, so an app or a story without a store of its own can apply what the surface sends; it SHALL return the document as given for an intent naming a tab, region or split the document doesn’t hold, SHALL name each tab, region and split it adds with an id the document doesn’t use unless the app gives it a namer, and SHALL never remove the last tab.

#### Scenario: Applying the surface’s own intents
- **WHEN** a story applies every intent the surface sends to the document it gives back
- **THEN** each edit appears in the surface as soon as it is made

#### Scenario: An intent that can’t apply
- **WHEN** an intent names a tab or region the document doesn’t hold
- **THEN** the function returns the document unchanged

#### Scenario: Docking through the applier
- **WHEN** a story applies a dock intent placing one region below another
- **THEN** the returned layout holds a column of the two where the target was, and the region is gone from where it was

#### Scenario: A resize naming no split
- **WHEN** a resize intent names a split the tab doesn’t hold
- **THEN** the applier returns the document unchanged

#### Scenario: The applier names what it adds
- **WHEN** an app applies an add-region intent twice with no namer of its own
- **THEN** the two new instances have different ids that no tab, region or split of the document used

#### Scenario: The app names what is added
- **WHEN** an app applies an add-tab intent with a namer of its own
- **THEN** the new tab has the id the app’s namer gave

#### Scenario: The last tab stays
- **WHEN** a document has one tab and the surface is editing
- **THEN** the tab’s Remove is disabled, and a remove-tab intent applied anyway returns the document unchanged

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

### Requirement: Intents are plain data in four kinds

Every intent SHALL be plain data that reads back the same after being written as JSON, and SHALL be one of four kinds an app can ask zen for: an edit (it changes the document and belongs in the app’s history), navigation (choosing a tab), history (undo and redo) or mode (edit mode, never in the document).

#### Scenario: An intent written down and read back
- **WHEN** every intent the surface sends is written as JSON and read back before the app applies it, and a person moves a region and adds another
- **THEN** each edit appears in the surface as it would have without the round trip

#### Scenario: What belongs in undo
- **WHEN** a person turns editing on, moves a region and then chooses another tab, in an app that keeps only edits in its history
- **THEN** the three intents are a mode, an edit and navigation, and undo takes back the move while the chosen tab stays open
