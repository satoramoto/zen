# push-surface Spec Delta

## Purpose

The whole Push 3 control surface drawn on screen as the unit is laid out: every control, its legend, its lamp and its place, reachable by pointer and keyboard, with the rear panel's ports.

## ADDED Requirements

### Requirement: The surface has every control of the unit

The surface SHALL draw 64 pads, eight encoders, the Volume encoder, the Swing & Tempo encoder, the jog wheel, the touch strip, eight upper and eight lower display buttons, eight scene and repeat-interval buttons, the five-way Session D-pad, the display, and the forty-two labelled buttons named in the manual's control reference, and nothing the unit does not have.

#### Scenario: The inventory is complete
- **WHEN** the surface is drawn with no Set
- **THEN** it has 64 pads, 11 rotary controls, one touch strip, 16 display buttons, 8 scene buttons, a D-pad of four arrows and a centre, one display and 42 labelled buttons

#### Scenario: Every control has a stable name
- **WHEN** a developer lists the surface's controls
- **THEN** each has one id that never changes with mode, such as the pad at row 3 column 5, encoder 4, or the Capture button

### Requirement: Controls sit where they sit on the unit

The surface SHALL place every control by one layout table measured from the manual's control figure: the encoders above the upper display buttons above the display above the lower display buttons above the pads, each column in line; the left column of transport and timing buttons with the touch strip beside the pads; the scene column to the right of the pads; and the navigation and edit buttons on the far right.

#### Scenario: The eight columns line up
- **WHEN** the surface is drawn at any width
- **THEN** encoder 3, upper display button 3, the display's third column, lower display button 3 and the third pad column share one centre line

#### Scenario: The clusters match the figure
- **WHEN** the surface is laid over the manual's control figure at the same width
- **THEN** every control's centre falls within its own outline in the figure

### Requirement: The button clusters are grouped as on the unit

The surface SHALL group buttons into the unit's clusters: Sets, Setup, Learn and User at the top left; Device, Mix, Clip and Session Screen at the top right; Undo and Save left of the display; Add and Swap right of it; Lock, Stop Clip, Mute and Solo left of the lower display buttons and Main right of them; and the left and right columns in the manual's order.

#### Scenario: The left column reads top to bottom
- **WHEN** a person reads the column left of the touch strip from the top
- **THEN** it reads Swing & Tempo, Tap Tempo, Metronome, Quantize, Fixed Length, Automate, New, Capture, Record, Play

#### Scenario: The right column reads top to bottom
- **WHEN** a person reads the column right of the scene buttons from the top
- **THEN** it reads the D-pad, Session and Note, Scale and Layout, Repeat and Accent, Double Loop and Duplicate, Convert and Delete, the Octave and Page arrows, Shift and Select

### Requirement: Every control carries the unit's legend

Each button SHALL show the legend the unit prints on it, as a word or as the unit's icon, and SHALL expose the manual's name for the control to assistive technology whichever it shows.

#### Scenario: An icon button is named
- **WHEN** a screen reader reaches the button drawn with a plus sign
- **THEN** it is announced as the Add button

#### Scenario: The scene buttons show their intervals
- **WHEN** the scene column is read from the top
- **THEN** the legends are 1/32t, 1/32, 1/16t, 1/16, 1/8t, 1/8, 1/4t and 1/4

### Requirement: A lamp shows only what it is told

Every control with a lamp SHALL draw the lamp state it is given (unlit, dim, lit, pulsing or blinking, with a colour where the unit's lamp has colour) and SHALL hold no lamp state of its own.

#### Scenario: A lamp follows the model
- **WHEN** the Metronome button is given a pulsing lamp
- **THEN** it pulses, and it stops when it is given a lit or unlit lamp

#### Scenario: A press does not light a button by itself
- **WHEN** a person presses Mute and the app gives no new lamp
- **THEN** the Mute lamp is unchanged after the press

### Requirement: Pulsing and blinking follow the tempo

A pulsing or blinking lamp SHALL animate in time with the beat the app reports, and SHALL animate at a fixed rate when no beat is reported.

#### Scenario: A queued clip blinks on the beat
- **WHEN** a pad is given a blinking lamp while the app reports a beat at 120 BPM
- **THEN** the pad blinks twice a second, in phase with the beat

### Requirement: A press is reported, not acted on

Pressing and releasing any button SHALL report one down and one up with the control's id and the time, and the surface SHALL change nothing else by itself.

#### Scenario: Press and release
- **WHEN** a person presses the Play button and lets go
- **THEN** one down and one up are reported for Play, each with its time

#### Scenario: A control taken away mid-press
- **WHEN** the surface is removed while a button is held
- **THEN** an up is reported for that button

### Requirement: Several controls can be held at once

The surface SHALL allow any number of controls to be held together, by several touches or by latching a hold from the keyboard or a pointer, so that every hold-and-press combination of the unit can be performed with one mouse.

#### Scenario: Two fingers
- **WHEN** a person holds Shift with one finger and presses Undo with another
- **THEN** Undo's down is reported while Shift is still held

#### Scenario: A latched hold with a mouse
- **WHEN** a person latches Delete with the surface's hold gesture and then clicks a pad
- **THEN** the pad's down is reported while Delete is held, and Delete is released when the latch is cleared

### Requirement: Every control is reachable from the keyboard

The surface SHALL give every control a place in the focus order, grouped by cluster, SHALL press the focused control with Space or Enter, turn a focused rotary control with the arrow keys, and SHALL map the computer keyboard's rows onto the pad grid when the grid has focus.

#### Scenario: Arrow keys move through the grid
- **WHEN** a pad has focus and a person presses the right arrow key
- **THEN** focus moves to the pad to its right without pressing it

#### Scenario: A rotary control turns
- **WHEN** encoder 1 has focus and a person presses the up arrow key
- **THEN** one turn of one step clockwise is reported for encoder 1

### Requirement: The surface scales as one object

The surface SHALL keep the unit's proportions at any size, scaling every control, legend and the display together, and SHALL stay legible and operable down to the width at which a pad is the smallest comfortable touch target.

#### Scenario: A narrow frame
- **WHEN** the surface is drawn in a frame half as wide
- **THEN** every control is half the size and in the same relative place, and the display's text is still readable

#### Scenario: Below the smallest size
- **WHEN** the frame is narrower than the surface's smallest size
- **THEN** the surface keeps its smallest size and the frame scrolls

### Requirement: The surface can be shown in part

The surface SHALL be drawable whole or as any one of its regions (the display with its encoders and buttons, the pad grid with the scene column and touch strip, the left column, the right column), each region keeping its own layout and behaviour.

#### Scenario: The display region alone
- **WHEN** an app draws only the display region
- **THEN** it shows the eight encoders, both rows of display buttons and the display, and they behave as they do in the whole surface

### Requirement: The rear panel shows the unit's connections

The surface SHALL offer the rear panel as its own part, with the power button and every port the manual lists (two audio inputs, two audio outputs, headphones, ADAT in and out, MIDI in and out, USB-A, USB-C, power, and the two pedal and CV jacks), each showing whether the app says something is plugged in.

#### Scenario: A pedal is plugged in
- **WHEN** the app says a footswitch is in the Pedal 1 jack
- **THEN** the Pedal 1 jack is drawn as connected and named as holding a footswitch

#### Scenario: The power button
- **WHEN** a person holds the power button for three seconds
- **THEN** a hold of the power button of that length is reported

### Requirement: A powered-off unit is dark

When the app says the unit is off, the surface SHALL draw every lamp unlit and the display blank, and SHALL still report presses.

#### Scenario: Off
- **WHEN** the app says the unit is off
- **THEN** no lamp is lit and the display shows nothing

### Requirement: Brightness is a setting

The surface SHALL dim all lamps by the LED brightness and the display by the display light the app gives, each from 0 to 100 percent.

#### Scenario: LEDs at half
- **WHEN** LED brightness is 50 percent
- **THEN** every lit pad and button is visibly dimmer than at 100 percent and the display is unchanged
