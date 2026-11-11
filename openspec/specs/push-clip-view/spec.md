# push-clip-view Specification

## Purpose

Clip View: a MIDI or audio clip drawn on the display with its loop, crop and zoom controls, Note Edit mode for single notes, warping and audio edit, and converting a clip or instrument with Convert.

## Requirements

### Requirement: Clip View draws the selected clip

Pressing Clip SHALL show the selected clip: its name as a block at the top left (MIDI Clip or Audio Clip when unnamed), a piano roll of its notes or its waveform across the body with bar and beat marks, its start, end and loop markers, and everything in the clip's colour.

#### Scenario: A MIDI clip
- **WHEN** Clip View is opened on a one-bar MIDI clip with eight notes
- **THEN** eight note bars are drawn against beat marks 1.2, 1.3 and 1.4, in the clip's colour

#### Scenario: An unnamed audio clip
- **WHEN** Clip View is opened on an audio clip with no name
- **THEN** the name block reads Audio Clip and the waveform is drawn

### Requirement: Velocity and pad colour show in the notes

A note SHALL be drawn more opaque the higher its velocity, and on a Drum Rack track each note SHALL take its pad's colour.

#### Scenario: A soft note
- **WHEN** a clip holds one note at velocity 30 and one at 127
- **THEN** the first is plainly fainter than the second

### Requirement: The view follows playback

While the clip plays, the display SHALL show a playhead and scroll to keep it in view.

#### Scenario: A long clip
- **WHEN** a four-bar clip plays while the view shows one bar
- **THEN** the view scrolls so the playhead stays visible

### Requirement: Loop is switched and set from the display

The second upper display button SHALL ask to switch Loop on or off; with Loop on the encoders SHALL set Loop Position, Loop Length and Start Offset, and with Loop off the clip's Start and End, in beats, or in sixteenths with Shift.

#### Scenario: A longer loop
- **WHEN** Loop is on and a person turns the Loop Length encoder one step clockwise
- **THEN** the app is asked to lengthen the loop by one beat

#### Scenario: Fine
- **WHEN** a person holds Shift and turns the Loop Position encoder one step
- **THEN** the app is asked to move the loop by one sixteenth

#### Scenario: Loop off
- **WHEN** Loop is off
- **THEN** the columns read Start and End in place of the loop parameters

### Requirement: Crop removes what is outside the markers

The third upper display button SHALL ask to crop a MIDI clip to its Start and End.

#### Scenario: Cropping
- **WHEN** a person presses the display button at Crop
- **THEN** the app is asked to crop the clip

### Requirement: Zoom is on the first encoder

The first encoder SHALL zoom the clip in and out around the position last adjusted, and a line under Zoom SHALL show the whole clip with the part in view highlighted.

#### Scenario: Zooming in on the loop start
- **WHEN** a person moves Loop Position and then turns Zoom clockwise
- **THEN** the view narrows around the loop's start and the highlighted part of the Zoom line shrinks

### Requirement: Playing layouts show all notes

With a real-time layout on the pads, Clip View SHALL fit every note of the clip in the display and show notes as they are recorded.

#### Scenario: Recording
- **WHEN** a person records notes in the 64 Notes layout with Clip View open
- **THEN** each note appears as it is played and the pitch range grows to fit it

### Requirement: Sequencing layouts show the area on the pads

With a sequencer on the pads, Clip View SHALL mark the page and pitches the pads can reach as a translucent box, show the pitch range in a strip at the left, and mark in that strip the pitch ranges that hold notes, thicker where there are more.

#### Scenario: The sequenceable area
- **WHEN** the Melodic Sequencer shows the second page
- **THEN** the box in Clip View covers the second page's time and the eight pitches on the pads

### Requirement: Note Edit mode is entered from the display or the jog wheel

Pressing the upper display button at Edit, or turning or pressing the jog wheel in Clip View of a MIDI clip, SHALL enter Note Edit mode, where the encoders show the highlighted note's parameters in place of the clip's.

#### Scenario: By the jog wheel
- **WHEN** Clip View shows a MIDI clip and a person turns the jog wheel
- **THEN** Note Edit mode is entered with one note highlighted

### Requirement: One note is always highlighted

In Note Edit mode exactly one note SHALL be highlighted with a white outline that pulses, and turning the jog wheel SHALL move the highlight through the notes in clip order.

#### Scenario: The next note
- **WHEN** a person turns the jog wheel one detent clockwise
- **THEN** the next note in the clip is highlighted

### Requirement: The encoders edit the highlighted note

In Note Edit mode the encoders SHALL ask to change the note's Position (by sixteenths), Nudge (a percentage off the grid), Length, Pitch (or Drum Pad on a Drum Rack track), Velocity (0 to 127), Vel Range and Probability.

#### Scenario: Pitch on an instrument track
- **WHEN** a person turns the Pitch encoder one step clockwise
- **THEN** the app is asked to raise the highlighted note by a semitone

#### Scenario: A Drum Rack track
- **WHEN** Note Edit mode is open on a Drum Rack track
- **THEN** the column reads Drum Pad in place of Pitch

#### Scenario: Probability
- **WHEN** a person turns the Probability encoder down
- **THEN** the app is asked to lower the note's probability

### Requirement: Notes are selected to edit several at once

Pressing the jog wheel SHALL add the highlighted note to the selection, drawn solid white; the encoders SHALL then ask their change of every selected note and the highlighted one; a parameter whose values differ SHALL show a range; and Select All and Deselect All SHALL be on upper display buttons.

#### Scenario: A chord's velocities
- **WHEN** three notes with velocities 60, 80 and 100 are selected
- **THEN** the Velocity column reads the range 60 to 100, and turning its encoder asks to move all three together

#### Scenario: Select All
- **WHEN** a person presses the display button at Select All
- **THEN** every note in the clip is drawn selected

### Requirement: Delete removes notes in Note Edit mode

In Note Edit mode, pressing Delete SHALL ask to delete the selected notes, or the highlighted note when none is selected.

#### Scenario: Deleting the highlight
- **WHEN** no note is selected and a person presses Delete
- **THEN** the app is asked to delete the highlighted note and the clip is not deleted

### Requirement: An audio clip shows warp controls

For an audio clip, Clip View SHALL add Warp (switched by its upper display button, its encoder choosing among Beats, Tones, Texture, Re-Pitch, Complex and Complex Pro), Transpose from minus 48 to plus 48 semitones (in cents with Shift) and Gain up to plus 24 dB.

#### Scenario: Choosing a warp mode
- **WHEN** a person turns the Warp encoder to Complex
- **THEN** the app is asked to set the clip's warp mode to Complex

#### Scenario: Cents
- **WHEN** a person holds Shift and turns Transpose one step
- **THEN** the app is asked to change the transposition by cents

### Requirement: Audio edit sets the downbeat and warps to the grid

Pressing Edit on an audio clip, or turning the jog wheel, SHALL enter its edit options: the jog wheel moves a position along the waveform, Set 1.1.1 asks to move the clip's start there, Warp to Grid asks to fit the audio to the Set's tempo, and Done returns to the loop parameters.

#### Scenario: Setting the start
- **WHEN** a person turns the jog wheel to a transient and presses the display button at Set 1.1.1
- **THEN** the app is asked to make that position the clip's start

### Requirement: An empty audio slot offers a sample

Clip View on an audio track with no clip selected SHALL invite loading a sample, and Swap SHALL open Hot-Swap Mode at the samples.

#### Scenario: Loading a sample
- **WHEN** Clip View shows an empty audio slot and a person presses Swap
- **THEN** Hot-Swap Mode opens in the Samples folder

### Requirement: Convert offers what fits the selection

Pressing Convert SHALL offer conversions for what is selected: an audio clip to a new Simpler, to a Drum Pad, or to MIDI by Harmony, Melody or Drums; a Simpler in Classic or One-Shot mode to a Drum Rack with it on the first pad; a sliced Simpler to a Drum Rack of its slices; a Drum Rack pad to a Simpler; and a track's devices to a Drum Rack; and it SHALL be unlit when nothing fits.

#### Scenario: Audio to drums
- **WHEN** an audio clip is selected and a person presses Convert and then the display button at Drums-MIDI
- **THEN** the app is asked to convert the clip to MIDI drums

#### Scenario: Slices to a kit
- **WHEN** a Simpler in Slicing mode is selected and a person presses Convert
- **THEN** the app is asked for a Drum Rack with one pad per slice

### Requirement: Quantize and Double Loop act on the clip

A quick press of Quantize SHALL ask to quantize the selected notes, or all of the clip's notes when none is selected, or an audio clip's transients; and Double Loop SHALL ask to double the loop's length and its material.

#### Scenario: Double Loop
- **WHEN** a one-bar clip is selected and a person presses Double Loop
- **THEN** the app is asked to double the loop
