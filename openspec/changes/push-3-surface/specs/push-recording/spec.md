# push-recording Spec Delta

## Purpose

Transport and recording from the surface: Play and Record, overdub, count-in, Fixed Length, Repeat, Accent, Capture, Quantize, the metronome, tempo and swing, automation, and undo.

## ADDED Requirements

### Requirement: Play starts and stops the Set

Pressing Play SHALL ask to start playback when stopped and to stop it when playing, and its lamp SHALL be green while playing.

#### Scenario: Stopping
- **WHEN** the Set is playing and a person presses Play
- **THEN** the app is asked to stop playback

### Requirement: Record steps through recording, playback and overdub

With an armed track, the first press of Record SHALL ask to record a new clip, the second to stop recording and keep the clip playing, and each press after that SHALL ask to switch overdub on or off.

#### Scenario: Three presses
- **WHEN** a person presses Record three times on an armed MIDI track
- **THEN** the app is asked to record, then to stop recording and play, then to overdub

### Requirement: The Record lamp tells the state

The Record button SHALL blink during a count-in, be solid red while recording or overdubbing, and be dim otherwise.

#### Scenario: Count-in
- **WHEN** a count-in is running
- **THEN** the Record button blinks, and it turns solid red when recording starts

### Requirement: Note Mode arms the selected MIDI track

In Note Mode a selected MIDI track SHALL be shown armed without being armed by hand; in Session Pad Mode, and for audio tracks in Control Mode, a track SHALL be armed only by hand.

#### Scenario: Selecting a MIDI track in Note Mode
- **WHEN** a person selects a MIDI track in Note Mode
- **THEN** the track's name carries the armed circle

### Requirement: Audio recording starts on the beat

Pressing Record on an armed audio track in Note Mode SHALL ask to record an audio clip, starting with the next beat when the Set is playing, and a second press SHALL ask to stop.

#### Scenario: Recording a guitar
- **WHEN** an audio track is armed and a person presses Record while the Set plays
- **THEN** the app is asked to record into a new clip from the next beat

### Requirement: Shift and Record reach the other view's recording

In Control Mode, Record SHALL ask for Arrangement recording when the app says the Arrangement is in focus and for Session recording otherwise, and Shift with Record SHALL ask for the other of the two.

#### Scenario: Arrangement from Session
- **WHEN** Session View is in focus in Control Mode and a person holds Shift and presses Record
- **THEN** the app is asked to toggle Arrangement recording

### Requirement: New prepares a place to record

Pressing New SHALL ask to stop the selected clip and prepare an empty clip slot on the selected track, in the form the Workflow preference sets.

#### Scenario: A fresh slot
- **WHEN** a clip is playing on the selected track and a person presses New
- **THEN** the app is asked to prepare an empty slot on that track for the next recording

### Requirement: Fixed Length switches on a press and opens on a hold

A quick press of Fixed Length SHALL ask to switch it on or off, its lamp lit when on; holding it SHALL show the lengths (from one beat to 32 bars) on the display buttons with the chosen one marked, and Phrase Sync as a switch.

#### Scenario: Four bars
- **WHEN** a person holds Fixed Length and presses the display button at 4 Bars
- **THEN** the app is asked to set the fixed length to four bars

#### Scenario: Phrase Sync
- **WHEN** a person holds Fixed Length and presses the display button at Phrase Sync
- **THEN** the app is asked to switch Phrase Sync on

### Requirement: Repeat turns the scene buttons into intervals

Pressing Repeat SHALL switch note repeat on, its lamp pulsing, and the scene buttons SHALL choose the repeat interval with the chosen one green; a quick press SHALL latch it and a held press SHALL keep it on only while held; and the state and interval SHALL be remembered per track.

#### Scenario: Latched
- **WHEN** a person presses and quickly releases Repeat
- **THEN** Repeat stays on and its lamp pulses

#### Scenario: Momentary
- **WHEN** a person holds Repeat, holds a pad and releases Repeat
- **THEN** repeated notes are asked for only while Repeat was held

### Requirement: A held pad repeats at the interval

With Repeat on, holding a pad SHALL ask for a stream of notes at the chosen interval for as long as it is held, each note's velocity following the pad's pressure, with the swing amount applied.

#### Scenario: Sixteenth hats
- **WHEN** Repeat is on at 1/16 and a person holds the hat's pad for one beat at 120 BPM
- **THEN** four hat notes are asked for, a sixteenth apart

#### Scenario: Pressing harder
- **WHEN** a person presses harder on the held pad
- **THEN** the repeated notes that follow carry higher velocities

### Requirement: Accent latches or holds

A quick press of Accent SHALL switch it on or off and a held press SHALL keep it on only while held, with its lamp lit while on.

#### Scenario: Momentary accent
- **WHEN** a person holds Accent, presses a pad lightly and releases Accent
- **THEN** that note carries full velocity and Accent is off afterwards

### Requirement: Capture keeps what was just played

Pressing Capture SHALL ask to make a clip from the notes just played on an armed track without Record having been pressed, and it SHALL be unlit when no track is armed.

#### Scenario: Capturing an idea
- **WHEN** a person plays a phrase on an armed track and presses Capture
- **THEN** the app is asked to capture the played notes into a new clip

### Requirement: Holding Quantize opens its options

Holding Quantize SHALL show Swing Amount, Quantize To and Quantize Amount under encoders and Rec. Quantize as a switch on an upper display button, each asking the app for its change.

#### Scenario: Record quantization
- **WHEN** a person holds Quantize and presses the display button at Rec. Quantize
- **THEN** the app is asked to switch record quantization on

#### Scenario: Half strength
- **WHEN** a person holds Quantize and turns Quantize Amount to 50 percent
- **THEN** the app is asked to set the quantize amount to 50 percent

### Requirement: The metronome switches on a press and opens on a hold

A quick press of Metronome SHALL ask to switch the click on or off, its lamp pulsing with the beat when on; holding it SHALL show the count-in length, the click's sound (Classic, Click, Wood), its Rhythm (Auto or a beat division) and the time signature's numerator and denominator under encoders.

#### Scenario: A two-bar count-in
- **WHEN** a person holds Metronome and turns the count-in encoder to 2 Bars
- **THEN** the app is asked to set the count-in to two bars

#### Scenario: Seven eight
- **WHEN** a person holds Metronome and turns the two time signature encoders to 7 and 8
- **THEN** the app is asked to set the time signature to 7/8

### Requirement: Count-in is unavailable with Link

When the Set says Link is on, the count-in setting SHALL be greyed.

#### Scenario: Link on
- **WHEN** Link is on and a person holds Metronome
- **THEN** the count-in column is greyed and turning its encoder asks nothing

### Requirement: Tap Tempo sets the tempo and can start the Set

Each press of Tap Tempo SHALL be reported with its time so the app can set the tempo from the taps, and the taps of one bar on a stopped Set SHALL also ask to start playback at that tempo.

#### Scenario: Four taps
- **WHEN** the Set is stopped in 4/4 and a person taps Tap Tempo four times half a second apart
- **THEN** the app is asked to set the tempo to 120 BPM and to start playback

### Requirement: Automate arms automation recording

Pressing Automate SHALL ask to switch automation recording on or off, its lamp red when on and white when off; Shift with Automate SHALL ask to re-enable overridden automation; and Delete with Automate SHALL ask to delete all automation in the clip.

#### Scenario: Re-enabling
- **WHEN** a person holds Shift and presses Automate
- **THEN** the app is asked to re-enable all overridden automation

### Requirement: An encoder turned while recording is marked as automation

While Automate is on and the Set is recording, the intents from turning a parameter's encoder SHALL be marked as automation and bracketed by the encoder's touch and release.

#### Scenario: Recording a sweep
- **WHEN** Automate is on, the clip is recording and a person touches, turns and releases a filter's encoder
- **THEN** the changes are asked as automation between a touch and a release for that parameter

### Requirement: Undo and redo

Pressing Undo SHALL ask to undo the last action and Shift with Undo SHALL ask to redo it.

#### Scenario: Undo
- **WHEN** a person presses Undo
- **THEN** the app is asked to undo

### Requirement: Delete removes the selected clip in Note Mode

In Note Mode, pressing Delete with nothing else held SHALL ask to delete the selected clip.

#### Scenario: Deleting the clip
- **WHEN** a clip is selected in the 64 Notes layout and a person presses Delete
- **THEN** the app is asked to delete that clip

### Requirement: Duplicate copies in the form the workflow sets

Pressing Duplicate with nothing else held SHALL ask for the duplication the Workflow preference names, a new scene of the playing clips or a copy of the selected clip.

#### Scenario: Scene Workflow
- **WHEN** the Workflow is Scene and a person presses Duplicate
- **THEN** the app is asked for a new scene holding all playing clips
