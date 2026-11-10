# live-host-contract Spec Delta

## ADDED Requirements

### Requirement: A failing pane is contained

When drawing a region’s pane throws, the surface SHALL draw a note in that region’s place naming it as stopped, with a retry that draws the pane again, SHALL tell the app which region failed and what the error said, and SHALL keep drawing and playing every other region.

#### Scenario: A pane that throws
- **WHEN** the app’s pane for one region throws while drawing
- **THEN** that region shows a note that it stopped, with a Retry, and the region beside it is drawn and takes input
- **AND** the app is told the region’s id and the error’s message

#### Scenario: Retry draws the pane again
- **WHEN** the cause of a pane’s failure is gone and a person presses its Retry
- **THEN** the pane is drawn in its region and the note is gone

#### Scenario: Retry while it is still broken
- **WHEN** a person presses Retry on a pane that still throws
- **THEN** the note stays, the app is told again, and the region beside it still plays

### Requirement: A host needs only a document and a pane

The surface SHALL draw, play and edit a DAW for a host that gives it only a document, one pane kind of its own, a pane for each instance and a way to apply intents (zen’s pure applier will do), with no targets, selection, history, settings or frame reader; what the host doesn’t give SHALL simply not be offered.

#### Scenario: The smallest DAW
- **WHEN** a host with a document, one pane kind of its own and the pure applier is played, then a person turns editing on and adds a second pane from the palette
- **THEN** the first pane took the press, the second pane is drawn beside it, and no undo, redo or bind control was ever offered

### Requirement: Nothing of the document hides in the surface

Two surfaces given the same document SHALL draw the same tabs and regions, an edit made in one SHALL appear in the other as soon as the app applies it, and each SHALL keep its own visual state (edit mode, open tools, the palette) apart from the other’s.

#### Scenario: An edit in one surface appears in the other
- **WHEN** two surfaces draw one document and a person swaps two regions in the first
- **THEN** both surfaces draw the regions in the new order
- **AND** the second surface is still in perform mode, with no edit frames

## MODIFIED Requirements

### Requirement: A pane asks with one intent per gesture

A pane SHALL turn each discrete gesture (a press, a pick, a toggle) into one named intent with one plain-data argument (an id, a reference such as a track and cell, or a 0–1 value), and a continuous gesture (a drag) into one such intent per step, each aimed at the target its region is bound to, and SHALL send nothing more once its region is removed mid-gesture.

#### Scenario: A bound region asks for its target
- **WHEN** a region fixed to the second track is pressed
- **THEN** its intent names the second track whatever track is selected

#### Scenario: Following the selection
- **WHEN** a region bound to the selected track is pressed after the selection changes
- **THEN** its intent names the newly selected track

#### Scenario: A drag cut off by removal
- **WHEN** a region is removed while a fader in it is being dragged
- **THEN** no further intent arrives from that drag
