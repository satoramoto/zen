# push-sampling Specification

## Purpose

Working with samples on the device through Simpler: its waveform on the display, its Classic, One-Shot and Slicing modes, slicing by transient, beat, region or by hand, and its edit options.

## Requirements

### Requirement: Simpler shows its sample

Device View on a Simpler with a sample SHALL draw the sample's waveform across the display with its start and end markers, the playing position while a note sounds, and the main bank's parameters over it: Zoom, Start and End on the first three encoders and Mode on the eighth, in every mode.

#### Scenario: A loaded sample
- **WHEN** Device View shows a Simpler holding a sample
- **THEN** the waveform is drawn with a marker at Start and one at End

#### Scenario: An empty Simpler
- **WHEN** Device View shows a Simpler with no sample
- **THEN** the display invites loading one with Swap

#### Scenario: Mode is last
- **WHEN** Device View shows a Simpler in each of its three modes
- **THEN** the eighth column reads Mode and the first three read Zoom, Start and End

### Requirement: Mode changes the parameters shown

Turning the Mode encoder SHALL ask to set Simpler to Classic, One-Shot or Slicing, and the main bank SHALL show that mode's parameters.

#### Scenario: To Slicing
- **WHEN** a person turns the Mode encoder to Slicing
- **THEN** the app is asked for Slicing mode and the bank reads Slice By and its companions once the app gives it

### Requirement: Zoom, Start and End work in every mode

In all three modes the Zoom encoder SHALL zoom the waveform, and Start and End SHALL ask to move the markers that bound the region the sample plays from.

#### Scenario: Trimming the start
- **WHEN** a person turns the Start encoder clockwise
- **THEN** the app is asked to move Start later and the marker moves once the app gives the new value

### Requirement: Classic mode shows the playing and loop region

In Classic mode the bank SHALL show S Start and Length as percentages of the region between Start and End, and Loop Length and Loop Fade, the last two greyed while Loop is off.

#### Scenario: Loop off
- **WHEN** Simpler is in Classic mode with Loop off
- **THEN** Loop Length and Loop Fade are greyed

### Requirement: One-Shot mode shows its envelope and trigger

In One-Shot mode the main bank SHALL show Fade In, Fade Out, Transpose up to 48 semitones either way and Gain on the fourth to seventh encoders, and Edit Mode SHALL offer Trigger and Gate as a pair at its second display button.

#### Scenario: Gate
- **WHEN** Simpler's Edit Mode is shown in One-Shot mode and a person presses the display button at Trigger and Gate
- **THEN** the app is asked to set the sample to fade out when the pad is released

#### Scenario: Gain is at hand
- **WHEN** Device View shows a Simpler in One-Shot mode
- **THEN** the seventh column of its main bank reads Gain

### Requirement: Slicing mode slices four ways

In Slicing mode Slice By SHALL choose Transient (with Sensitivity), Beat (with Division), Region (with Regions) or Manual, each showing its own companion parameter, and the slice markers SHALL be drawn on the waveform.

#### Scenario: By beat
- **WHEN** Slice By is set to Beat
- **THEN** the next column reads Division and the waveform shows a slice marker at each division

#### Scenario: More sensitive
- **WHEN** Slice By is Transient and a person raises Sensitivity
- **THEN** the app is asked for more slices, up to 64

### Requirement: Slices are made by hand on the pads

With Slice By set to Manual and Pad Slicing on, pressing a pad that holds a slice SHALL play from it and pressing an empty pad while the sample plays SHALL ask for a new slice at the playing position.

#### Scenario: A slice on the snare
- **WHEN** Pad Slicing is on, the sample is playing and a person taps an empty pad
- **THEN** the app is asked to place a slice at the position playing at that moment

### Requirement: A slice is nudged, split and deleted

Pressing a slice's pad SHALL select it; Nudge, on the fourth encoder of the main bank in Slicing mode, SHALL ask to move its marker, finer with Shift; Split Slice SHALL ask for a new slice in its middle; and holding Delete and tapping its pad SHALL ask to delete it.

#### Scenario: Deleting a slice
- **WHEN** a person holds Delete and taps a slice's pad
- **THEN** the app is asked to delete that slice

#### Scenario: Zooming to a slice
- **WHEN** a person taps a slice's pad and turns Zoom clockwise
- **THEN** the waveform zooms in around that slice

#### Scenario: Nudging a slice
- **WHEN** a person taps a slice's pad and turns the fourth encoder clockwise
- **THEN** the app is asked to move that slice's marker later

### Requirement: Playback of slices is chosen

In Slicing mode Playback SHALL choose Mono, Poly or Through, alongside Trigger or Gate.

#### Scenario: Through
- **WHEN** a person turns Playback to Through
- **THEN** the app is asked to play on through the sample from the triggered slice

### Requirement: Edit Mode holds the sample actions

Pressing Simpler's upper display button SHALL enter its Edit Mode: further banks on the lower display buttons, and on the upper display buttons, each where the unit has it, Loop on or off (Classic), Trigger or Gate (One-Shot and Slicing), Warp as a number of bars, halve and double the speed, Crop (not in Slicing), Reset Slices and Split Slice (Slicing) and Reverse; pressing the first button SHALL leave.

#### Scenario: Reversing
- **WHEN** Simpler's Edit Mode is shown and a person presses the display button at Reverse
- **THEN** the app is asked to reverse the sample

#### Scenario: Crop in Slicing
- **WHEN** Simpler is in Slicing mode and its Edit Mode is shown
- **THEN** Crop is not offered

#### Scenario: Resetting the slices
- **WHEN** Simpler's Edit Mode is shown in Slicing mode and a person presses the display button at Reset Slices
- **THEN** the app is asked to reset the slices

### Requirement: The pads follow Simpler's mode

A Simpler in Classic or One-Shot mode SHALL be played from the 64 Notes layout, and one in Slicing mode from the 64 Slices layout.

#### Scenario: Classic
- **WHEN** a track's instrument is a Simpler in Classic mode
- **THEN** the pads show the 64 Notes layout

### Requirement: A Simpler inside a Rack is reached by unfolding

When a preset holds its Simpler inside an Instrument Rack, Device View SHALL show the Rack's macros first and the waveform once the Rack is unfolded and the Simpler chosen.

#### Scenario: A preset
- **WHEN** a Simpler preset in a Rack is loaded
- **THEN** the display shows the Rack's macros, and the waveform after the Rack is unfolded and Simpler selected
