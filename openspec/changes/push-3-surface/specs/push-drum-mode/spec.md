# Spec Delta

## Purpose

Playing and arranging drums on the pads when a Drum Rack or a sliced sample is selected: the Loop Selector, 16 Velocities, 64 Pads and 64 Slices layouts, and selecting, colouring, muting, soloing, copying and deleting pads.

## ADDED Requirements

### Requirement: A Drum Rack track gets the drum layouts

When a MIDI track with a Drum Rack is selected in Note Mode, each press of Layout SHALL move to the next of Loop Selector, 16 Velocities and 64 Pads and back to the first.

#### Scenario: Cycling
- **WHEN** the pads show Loop Selector and a person presses Layout twice
- **THEN** the pads show 16 Velocities and then 64 Pads

### Requirement: Loop Selector splits the grid in three

In the Loop Selector layout the bottom left 4 by 4 pads SHALL play the 16 Drum Rack pads in view, the bottom right 4 by 4 SHALL be the loop length controls, and the top four rows SHALL be the step sequencer.

#### Scenario: Three sections
- **WHEN** the Loop Selector layout is shown
- **THEN** the lower left quarter plays drums, the lower right quarter shows loop pages and the upper half shows steps

### Requirement: Drum pad colours tell their state

A Drum Rack pad SHALL be lit in its own colour (the track's by default) when it holds a sound, grey when empty, green while playing, white when selected, dark blue when soloed and a darker version of its colour when muted.

#### Scenario: An empty pad
- **WHEN** a Drum Rack pad has no sound
- **THEN** it is grey

#### Scenario: A muted pad
- **WHEN** a Drum Rack pad is muted
- **THEN** it is a darker version of its colour

#### Scenario: The selected pad
- **WHEN** a person presses a Drum Rack pad
- **THEN** it is white when not sounding

### Requirement: Pressing a drum pad plays and selects it

Pressing a Drum Rack pad SHALL report its note and select it for sequencing and editing; holding Select while pressing it SHALL select it without reporting a note.

#### Scenario: Select without sound
- **WHEN** a person holds Select and presses a Drum Rack pad
- **THEN** the pad is selected and no note is reported

### Requirement: The Drum Rack is scrolled in banks

Octave Up and Down and the touch strip SHALL move the 16 pads in view by 16 pads, and by one row of four with Shift held.

#### Scenario: Up a bank
- **WHEN** the lowest 16 pads are in view and a person presses Octave Up
- **THEN** the next 16 pads are in view

#### Scenario: Up a row
- **WHEN** a person holds Shift and presses Octave Up
- **THEN** the view moves up by four pads

### Requirement: 16 Velocities plays one pad at sixteen levels

In the 16 Velocities layout the bottom right 4 by 4 pads SHALL play the selected Drum Rack pad at sixteen fixed velocities rising from the bottom left, in place of the loop length controls.

#### Scenario: Quiet and loud
- **WHEN** a person presses the lowest and then the highest velocity pad
- **THEN** the selected drum's note is reported at the lowest and then the highest of the sixteen velocities

### Requirement: Holding Layout borrows the other quarter

In Loop Selector, holding Layout SHALL show the 16 velocity pads in the bottom right quarter while held; in 16 Velocities, holding Layout SHALL show the loop length controls there; Shift with Layout SHALL lock the borrowed controls and a press of Layout SHALL unlock them.

#### Scenario: Momentary velocities
- **WHEN** the pads show Loop Selector and a person holds Layout
- **THEN** the bottom right quarter shows the 16 velocity pads until Layout is released

#### Scenario: Locked
- **WHEN** a person holds Shift and presses Layout in Loop Selector
- **THEN** the velocity pads stay after both are released, until Layout is pressed again

### Requirement: 64 Pads plays the whole grid

In the 64 Pads layout every pad SHALL play a Drum Rack pad, 64 in all, for real-time playing; holding Layout SHALL show the loop length controls on the top row, and Shift with Layout SHALL lock them.

#### Scenario: A large kit
- **WHEN** a Drum Rack with 40 filled pads is shown in 64 Pads
- **THEN** 40 pads are lit in their colours and the rest are grey

### Requirement: Mute and Solo act on a pad

Holding Mute and pressing a Drum Rack pad SHALL ask to mute or unmute that pad; holding Solo and pressing it SHALL ask to solo or unsolo it; neither SHALL report a note.

#### Scenario: Soloing the snare
- **WHEN** a person holds Solo and presses the snare's pad
- **THEN** the app is asked to solo that pad and no note is reported

### Requirement: Delete acts on a pad

Holding Delete and pressing a Drum Rack pad SHALL ask to delete that pad's notes from the clip when it has any, and to delete the pad's devices when it has none.

#### Scenario: Notes first
- **WHEN** the kick has notes in the clip and a person holds Delete and presses its pad
- **THEN** the app is asked to delete the kick's notes and the pad keeps its sound

#### Scenario: Then the sound
- **WHEN** a pad has no notes in the clip and a person holds Delete and presses it
- **THEN** the app is asked to delete the pad's devices

### Requirement: Duplicate copies a pad

Holding Duplicate, pressing one Drum Rack pad and then another SHALL ask to copy the first pad's devices onto the second, leaving the second's recorded notes.

#### Scenario: Copying a hat
- **WHEN** a person holds Duplicate, presses the closed hat's pad and then an empty pad
- **THEN** the app is asked to copy the closed hat's devices to the empty pad

### Requirement: A pad's colour is chosen from the grid

Holding Shift and tapping a Drum Rack pad SHALL show the colours on the grid's outer ring of pads, and tapping one SHALL ask to give the pad that colour.

#### Scenario: Picking a colour
- **WHEN** a person holds Shift, taps a drum pad and then taps the orange pad on the outer ring
- **THEN** the app is asked to colour that drum pad orange and the grid returns to the layout

### Requirement: Quantize acts on a pad

Holding Quantize and pressing a Drum Rack pad SHALL ask to quantize that pad's notes only.

#### Scenario: Quantizing the hats
- **WHEN** a person holds Quantize and presses the hat's pad
- **THEN** the app is asked to quantize the hat's notes and no others

### Requirement: An expressive kit shades its pads by kind

When the Set gives a Drum Rack's pads kinds (kicks and toms, snares, hats, percussion), the pads SHALL be lit in variations of the track's colour by kind.

#### Scenario: An MPE kit
- **WHEN** a kit that marks its pads by kind is loaded on a red track
- **THEN** the kick and tom pads are the track's red and the snare and hat pads are different shades of it

### Requirement: A sliced sample gets the 64 Slices layout

When the selected instrument is a Simpler in Slicing mode, the pads SHALL show one lit pad per slice in the 64 Slices layout, filling the left half in rows of four from the bottom, then the right half the same way, and Layout SHALL cycle 64 Slices, Loop Selector and 16 Velocities.

#### Scenario: Ten slices
- **WHEN** a sample has ten slices
- **THEN** ten pads are lit: the first four on the bottom row's left half, the next four above them and two on the third row

#### Scenario: More than 32 slices
- **WHEN** a sample has 33 slices
- **THEN** the thirty-third is on the bottom row of the right half

### Requirement: Switching layouts keeps the pads in view

Moving between 64 Pads and the 16-pad layouts SHALL leave the 16 pads in view where they were, as on the unit.

#### Scenario: Back from 64 Pads
- **WHEN** the second bank is in view in Loop Selector and a person goes to 64 Pads and back
- **THEN** the second bank is still in view
