# Spec Delta

## MODIFIED Requirements

### Requirement: Simpler shows its sample

Device View on a Simpler with a sample SHALL draw the sample's waveform across the display with its start and end markers, the playing position while a note sounds, and the main bank's parameters over it: Zoom, Start and End on the first three encoders and Mode on the eighth, in every mode.

#### Scenario: A loaded sample
- **WHEN** Device View shows a Simpler holding a sample
- **THEN** the waveform is drawn with a marker at Start and one at End

#### Scenario: An empty Simpler
- **WHEN** Device View shows a Simpler with no sample
- **THEN** the display invites loading one with Swap

#### Scenario: Mode is last
- **WHEN** Device View shows a Simpler in any of its three modes
- **THEN** the eighth column reads Mode and the first three read Zoom, Start and End

### Requirement: One-Shot mode shows its envelope and trigger

In One-Shot mode the main bank SHALL show Fade In, Fade Out, Transpose up to 48 semitones either way and Gain on the fourth to seventh encoders, and Trigger and Gate as a pair of options on the display buttons.

#### Scenario: Gate
- **WHEN** a person presses the display button at Gate
- **THEN** the app is asked to set the sample to fade out when the pad is released

#### Scenario: Gain is at hand
- **WHEN** Device View shows a Simpler in One-Shot mode
- **THEN** the seventh column of its main bank reads Gain

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
