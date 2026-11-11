# push-pads Spec Delta

## Purpose

The 8 by 8 pad grid as an expressive input and a matrix of coloured lamps: velocity, pressure, slide and per-note pitch bend from a pointer, shaped by the unit's expression and sensitivity settings.

## ADDED Requirements

### Requirement: A pad press carries a velocity

Pressing a pad SHALL report a note-on for that pad with a velocity from 1 to 127, and releasing it SHALL report a note-off; the velocity SHALL come from the input's own force where the device gives one, and otherwise from how the surface's velocity gesture is made.

#### Scenario: A pen press
- **WHEN** a person presses a pad with a pen at half force
- **THEN** a note-on is reported for that pad with a velocity near the middle of the range, and a note-off on release

#### Scenario: A mouse click
- **WHEN** a person clicks a pad with a mouse
- **THEN** a note-on is reported with the surface's default velocity

#### Scenario: A harder mouse click
- **WHEN** a person clicks a pad with the surface's hard-press gesture
- **THEN** the note-on's velocity is higher than a plain click's

### Requirement: A held pad reports pressure

While a pad is held, the grid SHALL report its pressure from 0 to 1 as it changes, from the input's force where there is one and otherwise from the surface's pressure gesture.

#### Scenario: Pressing harder
- **WHEN** a person holds a pad and presses harder with a pen
- **THEN** rising pressure values are reported for that pad until release

#### Scenario: Pressure with a mouse
- **WHEN** a person holds a pad with a mouse and uses the pressure gesture
- **THEN** pressure values are reported for that pad as the gesture moves

### Requirement: Vertical movement on a pad is slide

The grid SHALL report where on the pad's height a press lands and each vertical move while it is held, as slide from 0 at the bottom edge to 1 at the top, over the slide height the settings give.

#### Scenario: Striking high on the pad
- **WHEN** a person presses a pad near its top edge
- **THEN** the note-on carries a slide near 1

#### Scenario: Sliding up
- **WHEN** a person holds a pad and moves the pointer upward
- **THEN** rising slide values are reported for that pad

### Requirement: Horizontal movement on a pad is per-note pitch bend

The grid SHALL report horizontal movement on a held pad as that note's pitch bend, zero inside the in-tune width around the in-tune location and growing with distance beyond it, and SHALL carry the bend across onto neighbouring pads so a note can be bent from one pad to the next.

#### Scenario: A small wobble stays in tune
- **WHEN** a person holds a pad and moves less than the in-tune width
- **THEN** the reported bend stays at zero

#### Scenario: Bending to the next pad
- **WHEN** a person holds a pad and drags to the centre of the pad to its right
- **THEN** the bend reported for the held note reaches the interval to that pad's note

### Requirement: The in-tune location follows the setting

With In Tune Location set to Finger, the grid SHALL treat the point first touched as zero bend; set to Pad, it SHALL treat the pad's centre as zero bend so a press off centre starts bent.

#### Scenario: Finger
- **WHEN** In Tune Location is Finger and a person presses a pad at its left edge
- **THEN** the note starts with zero bend

#### Scenario: Pad
- **WHEN** In Tune Location is Pad and a person presses a pad at its left edge
- **THEN** the note starts bent downward

### Requirement: Bend becomes glissando where the instrument cannot bend

When the Set says the selected instrument does not take per-note pitch bend and Note Pitch Bend is automatic, dragging from a held pad onto another pad SHALL end the first note and start the second; with Note Pitch Bend on it SHALL always bend, and with it off it SHALL never bend.

#### Scenario: Automatic on an instrument without bend
- **WHEN** a person drags from one pad to the next on an instrument that does not take per-note bend
- **THEN** a note-off is reported for the first pad and a note-on for the second

#### Scenario: Forced off
- **WHEN** Note Pitch Bend is off and a person drags sideways on a pad of an instrument that does take bend
- **THEN** no bend is reported

### Requirement: The expression mode decides what a held pad sends

In MPE mode the grid SHALL report pressure, slide and bend per note; in Poly Aftertouch it SHALL report pressure per note and no slide or bend; in Mono Aftertouch it SHALL report one pressure for all held notes, the highest among them.

#### Scenario: Poly Aftertouch
- **WHEN** the expression mode is Poly Aftertouch and a person slides a held pad sideways and upward
- **THEN** only that pad's pressure is reported

#### Scenario: Mono Aftertouch
- **WHEN** the expression mode is Mono Aftertouch and two pads are held at different pressures
- **THEN** one pressure is reported, equal to the harder of the two

### Requirement: The sensitivity settings shape velocity

The grid SHALL shape raw force into velocity with the four sensitivity settings: Threshold as the least force that triggers, Range as the force that reaches full velocity, Drive pushing velocities toward the extremes, and Compand expanding them to the extremes when positive and holding them to the middle when negative.

#### Scenario: A raised threshold
- **WHEN** Threshold is raised and a person presses a pad lightly
- **THEN** no note-on is reported

#### Scenario: High drive
- **WHEN** Drive is raised and a person presses a pad at half force
- **THEN** the velocity is higher than at the default Drive

#### Scenario: Negative compand
- **WHEN** Compand is fully negative and pads are pressed lightly and hard
- **THEN** both velocities are near the middle of the range

### Requirement: Accent overrides velocity

While Accent is on, every note-on from the grid SHALL carry full velocity whatever the force.

#### Scenario: A light press with Accent
- **WHEN** Accent is on and a person presses a pad lightly
- **THEN** the note-on's velocity is 127

### Requirement: Many pads can be held at once

The grid SHALL track every held pad separately, each with its own pressure, slide and bend, for as many touches as the device gives and for pads latched by the surface's hold gesture.

#### Scenario: A chord
- **WHEN** a person holds three pads with three fingers and presses harder on one
- **THEN** pressure rises for that pad only and all three stay held

### Requirement: A pad's lamp is a colour and a state

Each pad SHALL be lit with the colour and state the model gives (unlit, lit at a brightness, pulsing, blinking), with the colour taken from the lamp colours by index or given as one of the named states' colours.

#### Scenario: A track-coloured pad
- **WHEN** a pad is given the track's colour at full brightness
- **THEN** it glows in that colour

#### Scenario: A dimmed pad
- **WHEN** a pad is given the same colour at low brightness
- **THEN** it is the same hue and plainly darker

### Requirement: A held pad shows it is held

A pad SHALL show a pressed state while it is held, on top of its lamp, growing with pressure, so a person sees which notes are down and how hard.

#### Scenario: Holding
- **WHEN** a person holds a pad and presses harder
- **THEN** the pad's pressed look deepens and returns when released

### Requirement: Touches leave a trace when asked

The grid SHALL be able to draw, as an option, where each held touch is on its pad and its bend and slide, so a developer can see the expression being sent.

#### Scenario: The trace is on
- **WHEN** the touch trace is on and a person slides a held pad up and right
- **THEN** a mark follows the touch within the pad and shows its slide and bend

#### Scenario: The trace is off
- **WHEN** the touch trace is off and a pad is held
- **THEN** only the pad's pressed look is drawn

### Requirement: Notes from outside light the grid

When the Set reports a note sounding that the grid did not play (a clip, an external keyboard), the pads that play that note SHALL show the playing colour while it sounds.

#### Scenario: An external keyboard
- **WHEN** the app reports middle C sounding from an external keyboard in the 64 Notes layout
- **THEN** every pad that plays middle C is green until the note ends
