# push-encoders Specification

## Purpose

The surface's rotary and linear controls and their gestures: the eight touch-sensitive encoders, the Volume and Swing & Tempo encoders, the jog wheel, the touch strip and the Session D-pad.

## Requirements

### Requirement: An encoder turns without end

Each encoder SHALL report turns as signed steps with no limit at either end, by dragging, by the wheel, and by the arrow keys, and SHALL show no position of its own.

#### Scenario: A drag
- **WHEN** a person drags upward on encoder 2
- **THEN** clockwise steps are reported for encoder 2 in proportion to the drag

#### Scenario: Past a full turn
- **WHEN** a person keeps turning an encoder clockwise through more than one full turn
- **THEN** steps keep being reported at the same rate

### Requirement: An encoder knows it is touched

Each of the eleven rotary controls SHALL report a touch when a person rests on it without turning and a release when they let go, and a turn SHALL always fall between a touch and a release.

#### Scenario: A touch without a turn
- **WHEN** a person presses on encoder 5 and lets go without moving
- **THEN** a touch and a release are reported for encoder 5 and no steps

#### Scenario: Hover touch with a mouse
- **WHEN** a person uses the surface's touch gesture on an encoder with a mouse
- **THEN** a touch is reported and held until the gesture ends

### Requirement: Shift makes a turn fine

A turn made while Shift is held SHALL be reported as fine, so the model can move the value in smaller steps.

#### Scenario: A fine turn
- **WHEN** a person holds Shift and turns encoder 1
- **THEN** each step is reported as fine

### Requirement: The Volume encoder turns, touches and presses

The Volume encoder SHALL report turns, touch and a press; the model SHALL adjust the chosen volume by 1 dB per step and by 0.1 dB with Shift, cycle the choice among main output, headphones, Main track and Cue on a press, and show the current choice on a touch.

#### Scenario: Pressing cycles the target
- **WHEN** the Volume encoder is set to the main output and a person presses it
- **THEN** it is set to the headphones output and the display names it

#### Scenario: Touching shows the target
- **WHEN** a person touches the Volume encoder
- **THEN** the display shows which volume it is set to and its level

#### Scenario: A fine volume turn
- **WHEN** a person holds Shift and turns the Volume encoder one step
- **THEN** the app is asked to change that volume by 0.1 dB

### Requirement: The Swing & Tempo encoder turns, touches and presses

The Swing & Tempo encoder SHALL report turns, touch and a press; the model SHALL change the tempo by 1 BPM per step and 0.1 BPM with Shift, or the swing by 1 percent between 0 and 100, switch between the two on a press, and show the current one on a touch.

#### Scenario: A tempo turn
- **WHEN** the encoder is set to Tempo and a person turns it three steps clockwise
- **THEN** the app is asked to raise the tempo by 3 BPM

#### Scenario: Switching to swing
- **WHEN** the encoder is set to Tempo and a person presses it
- **THEN** it is set to Swing and the display shows the swing amount

#### Scenario: Swing stops at its ends
- **WHEN** swing is 100 percent and a person turns the encoder clockwise
- **THEN** no change is asked

### Requirement: The jog wheel turns, presses and nudges

The jog wheel SHALL report turns in detents, a press, a touch, and a nudge to the left or to the right, each as its own input.

#### Scenario: A nudge
- **WHEN** a person nudges the jog wheel to the left
- **THEN** one left nudge is reported and no turn

#### Scenario: A press while turned
- **WHEN** a person turns the jog wheel two detents and presses it
- **THEN** two steps and then one press are reported

### Requirement: The jog wheel navigates by one rule

In any list or menu on the display, turning the jog wheel SHALL move the highlight, pressing it SHALL choose the highlighted item, nudging left SHALL go back to the enclosing menu, and nudging right SHALL open the item's own menu or its sub-menu.

#### Scenario: Back out of a sub-menu
- **WHEN** a sub-menu is open and a person nudges the jog wheel left
- **THEN** the enclosing menu has the highlight again, on the item that was open

#### Scenario: A context menu
- **WHEN** a saved Set is highlighted and a person nudges the jog wheel right
- **THEN** that Set's menu of Delete and Rename is shown

### Requirement: The D-pad navigates like the jog wheel

The Session D-pad's arrows SHALL move the highlight one item at a time in lists and menus and its centre SHALL choose, the same as turning and pressing the jog wheel, and each arrow SHALL be lit only when there is somewhere to go that way.

#### Scenario: Down in a list
- **WHEN** a list is shown and a person presses the D-pad's down arrow
- **THEN** the highlight moves down one item

#### Scenario: At the top
- **WHEN** the highlight is on the first item of a list
- **THEN** the D-pad's up arrow is unlit

### Requirement: The touch strip reports where it is touched

The touch strip SHALL report a touch, its position from 0 at the bottom to 1 at the top as it moves, and a release, and SHALL be drawn with the lamps the model gives along its length.

#### Scenario: A slide
- **WHEN** a person touches the strip in the middle and slides to the top
- **THEN** a touch at about 0.5, positions rising to 1, and a release are reported

### Requirement: The touch strip bends pitch or sets modulation when playing

With an instrument selected in a real-time layout, the strip SHALL act as pitch bend that springs back to centre on release, or as a modulation wheel that stays where it is left, toggled by holding Select and tapping the strip, with pitch bend the default.

#### Scenario: Pitch bend springs back
- **WHEN** the strip is in pitch bend and a person slides up and lets go
- **THEN** bend rises while held and returns to zero on release

#### Scenario: Switching to mod wheel
- **WHEN** a person holds Select and taps the strip
- **THEN** the strip acts as the modulation wheel and its lamps show the held value from the bottom

### Requirement: The touch strip's lamps show its job

The strip's lamps SHALL show a centre mark and the bend in pitch bend, a level from the bottom in modulation, and the visible bank or range among all of them when it scrolls a Drum Rack or a sequencer's notes.

#### Scenario: Drum Rack position
- **WHEN** a Drum Rack is selected and the second bank of 16 pads is in view
- **THEN** the strip's lamps mark the second bank's place along its length

### Requirement: The eight encoders act on the column below them

Each of the eight encoders SHALL act on what the display shows in its column, and an encoder whose column shows nothing it can change SHALL do nothing.

#### Scenario: An empty column
- **WHEN** the display's sixth column is empty and a person turns encoder 6
- **THEN** nothing is asked of the app

#### Scenario: A touched encoder marks its column
- **WHEN** a person touches encoder 3 over a parameter
- **THEN** that parameter is marked as touched in the display
