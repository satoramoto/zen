# live-parameters Specification

## Purpose

The app’s parameters as a control meets them: the catalogue the app lists, values as readings, moves and triggers as asks, and touch around a continuous gesture.

## Requirements

### Requirement: The app lists its parameters

The app SHALL give its parameters as plain data, each with an id, a label, an optional group, a range with its unit, and whether it moves along a range, switches or fires, and each parameter’s value now; a control SHALL be offered only the parameters of the kind it can move.

#### Scenario: The catalogue is plain data
- **WHEN** an app’s parameter catalogue and its values are written as JSON and read back
- **THEN** they are the same catalogue and values, each parameter with an id, a label, a range and one of the three ways of moving

#### Scenario: A pad is offered only what it can fire
- **WHEN** a person opens a pad’s sheet while building
- **THEN** its parameter list offers the parameters that fire, and none that move along a range or switch

### Requirement: A control asks; the app moves the value

Moving a continuous control or a switch SHALL send one parameter intent with the parameter and the requested value; pressing and releasing a button or a pad SHALL send a trigger intent on the press and another on the release; and a control SHALL show a new value only when the app gives it.

#### Scenario: A fader drag
- **WHEN** a person drags a fader up
- **THEN** each step sends a parameter intent with the fader’s parameter and a value in its range, and the fader reads back what the app gives

#### Scenario: A pad press and release
- **WHEN** a person presses a pad and lets go
- **THEN** one trigger intent with down is sent on the press and one with up on the release

#### Scenario: A move the app ignores
- **WHEN** a person moves a fader and the app gives no new value
- **THEN** the fader returns to the app’s value once the gesture ends

### Requirement: A continuous gesture says when it begins and ends

A continuous control (a fader, a knob, an XY for both its parameters) SHALL tell the app when a gesture on its parameter begins and when it ends, with every move of that gesture between the two; a key that steps the value SHALL be a whole gesture; a control taken away mid-gesture SHALL still end it; and a switch, a button and a pad SHALL send no touch.

#### Scenario: A fader drag is one touch
- **WHEN** a person drags a fader up and lets go
- **THEN** one touch down is sent for the fader’s parameter before its first move and one touch up after its last

#### Scenario: A key step is a whole touch
- **WHEN** a person focuses a fader and presses the up arrow once
- **THEN** a touch down, the move and a touch up are sent, in that order

#### Scenario: An XY touches both its parameters
- **WHEN** a person presses an XY bound to the delay’s time and feedback, and lets go
- **THEN** a touch down is sent for each of the two parameters on the press and a touch up for each on the release

#### Scenario: A pad is a trigger, not a touch
- **WHEN** a person presses a pad and lets go, then flips a toggle
- **THEN** the pad’s trigger down and up and the toggle’s move are sent, and no touch

#### Scenario: A control taken away mid-drag
- **WHEN** a fader is pressed and its pane is removed before the finger lifts
- **THEN** the touch down is followed by a touch up for the same parameter, so no touch is left down
