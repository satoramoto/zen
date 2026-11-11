# push-step-sequencing Spec Delta

## Purpose

Step sequencing on the pads: the drum sequencer, the Melodic Sequencer, Melodic Sequencer + 32 Notes, step size, loop length and pages, and editing and automating single steps.

## ADDED Requirements

### Requirement: Tapping a step adds or removes a note

In the drum sequencer, tapping an empty step SHALL ask to add a note for the selected drum pad at that step, and tapping a step that has one SHALL ask to remove it; adding a step to a stopped Set SHALL also ask to start playback.

#### Scenario: Adding a kick
- **WHEN** the kick is selected and a person taps the first step
- **THEN** the app is asked to add a kick note at the first step

#### Scenario: Removing it
- **WHEN** a person taps a step that holds a note of the selected pad
- **THEN** the app is asked to remove that note

### Requirement: Step colours tell their state

A step SHALL be grey when empty, the clip's colour when it holds a note (brighter for a higher velocity), a lighter version of the clip's colour when its note is muted, white while it is held, and unlit when it is outside the grid of a triplet step size.

#### Scenario: Velocity as brightness
- **WHEN** two steps hold notes at velocity 40 and 120
- **THEN** the second is plainly brighter than the first

#### Scenario: Triplets
- **WHEN** the step size is a triplet value
- **THEN** the two rightmost columns of step pads are unlit and do nothing

### Requirement: The playhead moves across the steps

While the clip plays, the step at the play position SHALL be green, or red while recording, moving from step to step and page to page.

#### Scenario: Recording
- **WHEN** the clip is recording
- **THEN** the moving step is red

### Requirement: The scene buttons set the step size

In Note Mode the eight scene buttons SHALL choose the step size from 1/32t to 1/4, the chosen one lit, with 1/16 the default.

#### Scenario: Eighth notes
- **WHEN** a person presses the scene button marked 1/8
- **THEN** each step pad stands for an eighth note and that button is lit

### Requirement: Mute deactivates a step

Holding Mute and tapping a step SHALL ask to mute or unmute the notes in it without removing them.

#### Scenario: Muting a step
- **WHEN** a person holds Mute and taps a step that holds a note
- **THEN** the app is asked to mute that note and the step turns to the lighter colour once the app does

### Requirement: Select adds steps silently

Holding Select and pressing a Drum Rack pad SHALL select it for sequencing without sounding it, so steps can be added during a performance.

#### Scenario: Silent selection
- **WHEN** a person holds Select, presses the clap's pad and then taps a step
- **THEN** a clap note is asked for at that step and no clap was sounded by the selection

### Requirement: A velocity pad sets a step's velocity

In 16 Velocities, a step added after pressing a velocity pad SHALL take that velocity, and holding a step while pressing a velocity pad SHALL ask to set that step's velocity.

#### Scenario: Changing a step
- **WHEN** a person holds a step with a note and presses the lowest velocity pad
- **THEN** the app is asked to set that note to the lowest of the sixteen velocities

### Requirement: Loop length pads are pages

Each loop length pad SHALL stand for one page of steps; holding one and tapping another SHALL ask to set the loop from the first page to the second, and double-tapping one SHALL ask to set the loop to that page alone.

#### Scenario: Four pages
- **WHEN** a person holds the first loop length pad and taps the fourth
- **THEN** the app is asked to make the loop four pages long from the first page

#### Scenario: One page
- **WHEN** a person double-taps the third loop length pad
- **THEN** the app is asked to set the loop to the third page only

### Requirement: Loop length pad colours tell their state

A loop length pad SHALL be unlit when its page is outside the loop, grey when inside but not in view, white when in view and not playing, green when playing and red when recording.

#### Scenario: Playing page out of view
- **WHEN** the loop is two pages, the first is in view and the second is playing
- **THEN** the first pad is white and the second green

### Requirement: The view follows playback until a page is chosen

The steps in view SHALL follow the playing page; a single tap on a loop length pad inside the loop SHALL lock the view to that page without changing the loop; and re-setting the loop, or holding Page Left or Page Right, SHALL turn following back on.

#### Scenario: Locking the view
- **WHEN** a two-page loop is playing and a person taps the first loop length pad
- **THEN** the steps stay on the first page while the second page plays

#### Scenario: A tap outside the loop
- **WHEN** a person single-taps a loop length pad outside the loop
- **THEN** the app is asked to set the loop to that page

### Requirement: Page buttons move the view

Page Left and Page Right SHALL move the steps in view to the previous or next page and SHALL be unlit when there is none.

#### Scenario: Next page
- **WHEN** the first of two pages is in view and a person presses Page Right
- **THEN** the second page is in view and Page Right is unlit

### Requirement: A page of steps can be copied and cleared

Holding Duplicate, pressing one loop length pad and then another SHALL ask to add the first page's steps, with their expression data, onto the second; holding Delete and tapping a loop length pad SHALL ask to clear that page.

#### Scenario: Copying page one to page two
- **WHEN** a person holds Duplicate, presses the first loop length pad and then the second
- **THEN** the app is asked to copy the first page's notes onto the second, keeping what is there

### Requirement: Delete clears the pattern

In a sequencer layout, pressing Delete alone SHALL ask to delete the clip.

#### Scenario: Starting over
- **WHEN** a person presses and releases Delete with nothing else held
- **THEN** the app is asked to delete the selected clip

### Requirement: The Melodic Sequencer uses all eight rows

In the Melodic Sequencer each column SHALL be a step and each row a pitch of the scale (every semitone in Chromatic, out-of-key rows unlit), the root's row white at the bottom, and tapping a pad SHALL ask to add or remove that pitch at that step, with several pitches allowed in a step.

#### Scenario: A chord in one step
- **WHEN** a person taps three pads in the first column
- **THEN** the app is asked to add three notes at the first step

#### Scenario: A playing column
- **WHEN** the clip plays in the Melodic Sequencer
- **THEN** a column of green pads moves from left to right

### Requirement: The Melodic Sequencer's range is moved by octave, note and strip

Octave Up and Down SHALL move the Melodic Sequencer's pitch range by an octave and, with Shift, by one scale note; the touch strip SHALL move it by scale notes and, with Shift, by octaves; and the display SHALL show the new range.

#### Scenario: One note up
- **WHEN** a person holds Shift and presses Octave Up
- **THEN** every row plays the next scale note up and the display shows the range

### Requirement: The Melodic Sequencer's loop length row appears on hold

In the Melodic Sequencer, holding Layout SHALL show the loop length pads on the top row, each page being eight steps; Shift with Layout SHALL lock them; and the locked state SHALL be remembered per track.

#### Scenario: A momentary look
- **WHEN** a person holds Layout in the Melodic Sequencer
- **THEN** the top row shows the loop pages until Layout is released

### Requirement: Melodic + 32 Notes splits the grid

In Melodic Sequencer + 32 Notes the bottom four rows SHALL play and select notes of the scale (the root in the track's colour, the others white, a selected note a lighter shade of the track's colour, a sounding note green) and the top four rows SHALL be 32 steps.

#### Scenario: Selecting and placing
- **WHEN** a person presses two note pads and then taps a step
- **THEN** the app is asked to add both notes at that step

#### Scenario: Several steps at once
- **WHEN** a person holds three steps with notes selected
- **THEN** the selected notes are asked for at all three steps

### Requirement: Holding a step shows its notes

In Melodic + 32 Notes, holding a step SHALL light the notes it contains on the lower half, and tapping one of them SHALL ask to remove it from the step.

#### Scenario: Removing one note of a chord
- **WHEN** a person holds a step containing C and E and taps the E pad
- **THEN** the app is asked to remove E from that step

### Requirement: A step can be copied

In Melodic + 32 Notes, holding Duplicate, pressing a step and then another SHALL ask to copy the first step's notes to the second.

#### Scenario: Copying a step
- **WHEN** a person holds Duplicate, presses step 1 and then step 5
- **THEN** the app is asked to copy step 1's notes to step 5

### Requirement: Melodic + 32 Notes shows its loop length on the fifth row

In Melodic + 32 Notes, holding Layout SHALL show the loop length pads on the fifth row from the bottom, lockable with Shift and remembered per track.

#### Scenario: The fifth row
- **WHEN** a person holds Layout in Melodic + 32 Notes
- **THEN** the lowest row of steps shows the loop pages until Layout is released

### Requirement: Holding steps opens their parameters

In Clip View, Device View or Mix View, holding one or more steps SHALL turn the encoders to those steps: in Clip View the notes' nudge, length, velocity and the other step parameters, shown zoomed to the held steps; in Device and Mix View the automation of each parameter at the time of those steps.

#### Scenario: Velocity of two steps
- **WHEN** Clip View is shown and a person holds two steps and turns the Velocity encoder
- **THEN** the app is asked to change the velocity of the notes in both steps, and the display shows the range of their values

#### Scenario: Automation on an empty step
- **WHEN** Device View is shown and a person holds a step with no note and turns the encoder over a filter's frequency
- **THEN** the app is asked to set that parameter's automation for the time of that step

### Requirement: All of a drum pad's steps can be edited together

In the drum sequencer, holding Select, holding a Drum Rack pad, releasing Select and turning an encoder SHALL ask for that change on every step of that pad.

#### Scenario: All the hats quieter
- **WHEN** a person holds Select, holds the hat's pad, releases Select and turns the Velocity encoder down
- **THEN** the app is asked to lower the velocity of every hat note in the clip

### Requirement: The touch strip does not bend in the Melodic Sequencer

In the Melodic Sequencer the touch strip SHALL only move the pitch range and SHALL send no pitch bend or modulation.

#### Scenario: A slide in the sequencer
- **WHEN** a person slides the touch strip in the Melodic Sequencer
- **THEN** the pitch range moves and no pitch bend is reported
