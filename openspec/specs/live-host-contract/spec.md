# live-host-contract Specification

## Purpose

What a pane in a composed DAW reads from its host, what it asks for, how values that change every frame reach it, and what a host can count on: a failing pane contained, and nothing of the document kept in the surface.

## Requirements

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

### Requirement: A pane draws what the host says

A pane SHALL draw only the readings its host gives it (what is playing, queued, muted, selected or measured), and SHALL show a reading the host doesn’t give as missing rather than as a made-up value.

#### Scenario: A press without a host change
- **WHEN** a person launches a clip and the host doesn’t queue it
- **THEN** the clip still reads as it did before the press

#### Scenario: The host confirms
- **WHEN** a person launches a clip and the host queues it
- **THEN** the clip reads queued

#### Scenario: A measurement the host doesn’t give
- **WHEN** the host gives no DSP load
- **THEN** the pane shows the load as missing, not as zero

### Requirement: A pane asks with plain intents

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

### Requirement: Fast values are read by the parts that draw them

The host SHALL be able to give a pane a frame reader for values that change every frame (meters, playheads, beat), and only the leaf parts that draw those values SHALL read it, each animation frame, without the rest of the pane drawing again.

#### Scenario: Meters move on the frame
- **WHEN** the host’s frame reader reports new levels on each frame
- **THEN** the meters follow them while the pane’s other parts are not redrawn

#### Scenario: No frame reader and no measurement
- **WHEN** a pane is given no frame reader and no measured level or position
- **THEN** its meters and playhead are not drawn, and the rest of the pane is
