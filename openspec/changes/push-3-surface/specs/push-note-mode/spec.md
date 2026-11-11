# push-note-mode Spec Delta

## Purpose

Playing melodies and harmonies on the pads: the 64 Notes layout, keys and scales, the grid's interval layouts, octaves and the touch strip.

## ADDED Requirements

### Requirement: An instrument track gets the 64 Notes layout

When a MIDI track with a melodic instrument is selected in Note Mode, the pads SHALL play notes in the 64 Notes layout: by default C major, the bottom left pad C1, each pad to the right the next note of the scale and each pad upward a fourth higher.

#### Scenario: The default grid
- **WHEN** a new Set's instrument track is selected in Note Mode
- **THEN** the bottom left pad plays C1, the pad to its right D1 and the pad above it F1

#### Scenario: A triad shape
- **WHEN** a person presses the bottom left pad, the pad two to its right and the pad above and one to the right of the first
- **THEN** the notes C, E and G are reported

### Requirement: Pad colours show the scale

In the note layouts the pads SHALL be lit in the track's colour for the root note of the key, white for the other notes of the scale, unlit for notes outside the scale in Chromatic, and green for a note that is sounding.

#### Scenario: Roots stand out
- **WHEN** the 64 Notes layout is shown in C major on a blue track
- **THEN** every pad that plays C is blue and the other pads are white

#### Scenario: A sounding note
- **WHEN** a person holds a pad that plays E
- **THEN** every pad that plays that same E is green while it is held

### Requirement: Scale opens the key and scale menu

Pressing Scale SHALL show the scale menu: the twelve keys on the upper and lower display buttons in the manual's arrangement, the list of scales chosen with the encoders or the D-pad, and pressing Scale again SHALL close it.

#### Scenario: Choosing a key
- **WHEN** the scale menu is open and a person presses the display button at G
- **THEN** the app is asked to set the key to G and G is the marked key

#### Scenario: Choosing a scale
- **WHEN** the scale menu is open and a person turns an encoder over the scale list to Dorian
- **THEN** the app is asked to set the scale to Dorian and the pads are relit for it

### Requirement: The grid's interval layout is chosen in the scale menu

The scale menu's first encoder SHALL choose how the grid is laid out: 4ths (each pad upward a fourth higher), 3rds (each pad upward a third higher) or Sequential (the notes run on in scale order from row to row).

#### Scenario: Thirds
- **WHEN** the layout is set to 3rds in C major
- **THEN** the pad above the bottom left pad plays E1

#### Scenario: Sequential
- **WHEN** the layout is set to Sequential in C major
- **THEN** the first pad of the second row plays the note after the last pad of the first row

### Requirement: In Key and Chromatic

The scale menu's first lower display button SHALL switch between In Key, where every pad plays a note of the scale, and Chromatic, where every semitone has a pad and pads outside the scale are unlit but still play.

#### Scenario: Chromatic
- **WHEN** Chromatic is chosen in C major
- **THEN** the pad to the right of the bottom left pad plays C sharp and is unlit

### Requirement: Fixed keeps the grid in place when the key changes

With Fixed on, changing the key SHALL keep each pad's position so the bottom left pad stays on C or the scale's nearest note to it; with Fixed off, the grid SHALL shift so the bottom left pad plays the key's root.

#### Scenario: Fixed off
- **WHEN** Fixed is off and the key changes from C to D
- **THEN** the bottom left pad plays D

#### Scenario: Fixed on
- **WHEN** Fixed is on and the key changes from C to G
- **THEN** the bottom left pad still plays C

### Requirement: Scale settings belong to the Set

The key, scale, interval layout, In Key or Chromatic and Fixed SHALL be read from the Set, so a Set opens with the settings it was saved with.

#### Scenario: Opening a Set
- **WHEN** a Set saved in F minor is given to the device
- **THEN** the pads are laid out in F minor without opening the scale menu

### Requirement: Octave buttons move the grid

Octave Up and Octave Down SHALL shift the pads' notes by an octave, SHALL show the new range on the display for a moment, and SHALL be unlit at the end of the range.

#### Scenario: Up an octave
- **WHEN** the bottom left pad plays C1 and a person presses Octave Up
- **THEN** it plays C2 and the display shows the new range briefly

### Requirement: The touch strip serves the notes

In the 64 Notes layout the touch strip SHALL send pitch bend or modulation for the whole instrument, as the encoders capability sets out, alongside the pads' own per-note expression.

#### Scenario: Bend while holding a chord
- **WHEN** a person holds three pads and slides the strip up in pitch bend
- **THEN** one pitch bend is reported for the instrument and the three notes stay held

### Requirement: Layout steps through the melodic layouts

On a melodic instrument track, each press of Layout SHALL move to the next of 64 Notes, Melodic Sequencer and Melodic Sequencer + 32 Notes and back to the first, and the display SHALL name the layout entered.

#### Scenario: Three presses
- **WHEN** the pads show 64 Notes and a person presses Layout three times
- **THEN** the pads show Melodic Sequencer, then Melodic Sequencer + 32 Notes, then 64 Notes again

### Requirement: The layout is remembered per track

The device SHALL remember each track's pad layout and show it again when the track is selected.

#### Scenario: Coming back to a track
- **WHEN** track 1 is left in the Melodic Sequencer, track 2 is selected and then track 1 again
- **THEN** the pads show the Melodic Sequencer

### Requirement: A track with no instrument has no notes to play

When the selected track has nothing the pads can play (an audio track, a MIDI track with no instrument), the pads in Note Mode SHALL be unlit and presses SHALL report no notes.

#### Scenario: An audio track
- **WHEN** an audio track is selected in Note Mode
- **THEN** the pads are unlit
