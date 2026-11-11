# push-mix-view Spec Delta

## Purpose

Mixing and track control on the device: Global and Track Mix Modes, input and output routing, the Main track, track options, group and Rack unfolding, and the track actions (select, arm, stop, mute, solo, lock, duplicate, delete).

## ADDED Requirements

### Requirement: Mix steps between two modes

The first press of Mix SHALL show Global Mix Mode, and each further press SHALL switch between Global Mix Mode and Track Mix Mode.

#### Scenario: Two presses
- **WHEN** Device View is shown and a person presses Mix twice
- **THEN** Global Mix Mode is shown and then Track Mix Mode

### Requirement: Global Mix Mode shows one parameter across eight tracks

Global Mix Mode SHALL show, for the eight tracks in view, one mixer parameter each, chosen by the tabs in the top row: Volumes, Pans, or one tab per return track's sends; with Volumes each column SHALL show the track's level meter, its volume marker and its value in dB in the track's colour.

#### Scenario: Volumes
- **WHEN** Global Mix Mode shows Volumes
- **THEN** each column has a stereo meter, a mark at the track's volume and a reading such as 0.0 dB

#### Scenario: Pans
- **WHEN** a person presses the upper display button at Pans
- **THEN** each column shows its track's pan and the encoders ask to change pans

### Requirement: An encoder mixes its track

In Global Mix Mode, turning an encoder SHALL ask to change the shown parameter of the track in its column, finer with Shift.

#### Scenario: Riding a volume
- **WHEN** Volumes is shown and a person turns encoder 2 anticlockwise
- **THEN** the app is asked to lower the volume of the second track in view

### Requirement: Meters move at their own rate

A track's meter SHALL show the level the app measures as it changes, without the rest of the screen being redrawn, and SHALL hold a peak mark briefly.

#### Scenario: A loud hit
- **WHEN** the app reports a track's level jumping to near full and falling back
- **THEN** the meter rises and falls with it and the peak mark stays a moment longer

### Requirement: Many returns page the send tabs

When the Set has six or more return tracks, the last tab in Global Mix Mode SHALL become an arrow that brings further sends into the row, with Volumes and Pans always in view.

#### Scenario: Eight returns
- **WHEN** a Set has eight return tracks
- **THEN** the last upper display button shows an arrow, and pressing it shows the next sends while Volumes and Pans stay

### Requirement: Track Mix Mode shows one track's mixer

Track Mix Mode SHALL show the selected track's volume, pan and each send as parameters under the encoders, with Mix and Input & Output as the two leftmost tabs, and arrows on the two rightmost upper display buttons when more than six returns exist.

#### Scenario: One track's sends
- **WHEN** Track Mix Mode is shown for a track in a Set with two returns
- **THEN** the columns show Volume, Pan, A send and B send, each with its value

### Requirement: Input & Output sets monitoring and routing

With Input & Output chosen, the first encoder SHALL set monitoring (In, Auto, Off), the second SHALL switch between Input and Output, and the next encoders SHALL choose the type and the channel, and, for an input taken from another track, the tap point (Pre FX, Post FX, Post Mixer).

#### Scenario: Choosing input 2
- **WHEN** Input is shown and a person turns the Input Channel encoder to 2
- **THEN** the app is asked to set the track's input channel to 2

#### Scenario: Monitoring off
- **WHEN** a person turns the first encoder to Off
- **THEN** the app is asked to turn the track's monitoring off

### Requirement: Routing lists what the Set offers

The input and output types and channels SHALL be exactly those the Set lists for the track, so ADAT channels 9 to 16 appear only when an extender is connected and an external interface's channels appear in Control Mode.

#### Scenario: No ADAT
- **WHEN** the Set lists inputs 1, 2 and 1/2 only
- **THEN** the Input Channel encoder offers those three and no others

### Requirement: Main shows the Main track and returns

Pressing Main SHALL select the Main track and show its volume and pan (or left and right pan when the Set says pan is split), with Input & Output to set the Main and Cue outputs; pressing Main again SHALL return to the track selected before.

#### Scenario: There and back
- **WHEN** track 3 is selected and a person presses Main twice
- **THEN** the Main track's mixer is shown and then track 3 is selected again

### Requirement: The lower display buttons select tracks

In the Set screens, pressing a track's lower display button SHALL ask to select it, and the D-pad's left and right arrows SHALL ask to select the previous or next track, bringing it into view.

#### Scenario: A ninth track
- **WHEN** the eighth track in view is selected and a person presses the D-pad's right arrow
- **THEN** the ninth track is asked to be selected and the row scrolls to show it

### Requirement: A selected group or Rack track unfolds

Pressing the lower display button of an already selected group track, or of a track holding an Instrument or Drum Rack, SHALL unfold it so its tracks or chains follow it in the row, underlined together, each mixable like a track; pressing again SHALL fold it.

#### Scenario: Mixing a kit
- **WHEN** a person presses the selected Drum Rack track's lower display button in Global Mix Mode
- **THEN** the kit's pads follow the track in the row, each with its own volume

#### Scenario: Jumping to a pad
- **WHEN** a Drum Rack is unfolded in the mixer and a person holds Select and taps a drum pad
- **THEN** the row scrolls to that pad's chain and selects it

### Requirement: Mute and Solo act on tracks

Pressing Mute or Solo SHALL ask to mute or solo the selected track; holding either and pressing a track's lower display button SHALL ask it of that track; a muted track's button SHALL be unlit and its controls grey; and while any track is soloed the others' buttons SHALL be unlit and their controls grey.

#### Scenario: Muting another track
- **WHEN** a person holds Mute and presses lower display button 5
- **THEN** the app is asked to mute the fifth track in view and the selection is unchanged

#### Scenario: The Mute lamp
- **WHEN** the selected track is muted
- **THEN** the Mute button is lit

### Requirement: Exclusive solo and arm follow the preference

With Exclusive Solo on, soloing a track SHALL ask to unsolo the others, and with Exclusive Arm on, arming one SHALL ask to disarm the others; with either off, several may be soloed or armed.

#### Scenario: Two armed tracks
- **WHEN** Exclusive Arm is off and a person holds Record and presses two tracks' lower display buttons
- **THEN** the app is asked to arm both

### Requirement: Lock ties an action to the lower display buttons

Holding Lock and pressing Stop Clip, Mute or Solo SHALL lock that action: both buttons blink, and each press of a lower display button asks that action of its track in place of selecting it, until Lock or the action's button is pressed again.

#### Scenario: Solo locked
- **WHEN** Solo is locked and a person presses lower display button 2
- **THEN** the app is asked to solo the second track in view and the selection is unchanged

#### Scenario: Unlocking
- **WHEN** Solo is locked and a person presses Lock
- **THEN** the buttons stop blinking and the lower display buttons select tracks again

### Requirement: A track is armed from its button

Holding Record and pressing a track's lower display button, or pressing a track's button twice quickly, SHALL ask to arm or disarm it.

#### Scenario: A double press
- **WHEN** a person presses a track's lower display button twice quickly
- **THEN** the app is asked to arm that track

### Requirement: Tracks are duplicated and deleted from their buttons

Holding Duplicate and pressing a track's lower display button SHALL ask to duplicate the track, and holding Delete and pressing it SHALL ask to delete it.

#### Scenario: Deleting a track
- **WHEN** a person holds Delete and presses lower display button 4
- **THEN** the app is asked to delete the fourth track in view

### Requirement: Shift and a track's button opens its options

Holding Shift and pressing a track's lower display button SHALL show the track's options (Rename, Group, Freeze, Flatten) on the lower display buttons and the track colours on the pads; pressing further tracks' buttons with Shift held SHALL add them for grouping.

#### Scenario: Renaming
- **WHEN** a track's options are shown and a person presses the display button at Rename
- **THEN** text entry opens with the track's name

#### Scenario: A new colour
- **WHEN** a track's options are shown and a person taps the teal pad
- **THEN** the app is asked to colour the track teal

#### Scenario: Grouping three tracks
- **WHEN** a person holds Shift, presses three tracks' lower display buttons and presses Group
- **THEN** the app is asked to group those three tracks

### Requirement: Freeze and Flatten follow the track's state

Freeze SHALL be offered for a track that is not frozen and Flatten only for one that is, each asking the app for that action.

#### Scenario: Flatten needs a frozen track
- **WHEN** the options of a track that is not frozen are shown
- **THEN** Flatten is greyed and pressing it asks nothing
