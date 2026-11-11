# Spec Delta

## ADDED Requirements

### Requirement: A touched choice shows the choices beside it

While the encoder of a parameter that takes one of a list of choices is touched or turned, its cell SHALL show the current choice at the large size with the other choices dim beneath it in their order, keeping the current one in view; untouched, it SHALL show the current choice alone.

#### Scenario: Touching a choice
- **WHEN** a person touches the encoder over a parameter with four choices
- **THEN** its cell shows the current choice large and the other three dim beneath it

#### Scenario: Turning to the next choice
- **WHEN** a person turns that encoder one step clockwise
- **THEN** the app is asked for the next choice, and it is shown large once the app gives it

#### Scenario: Letting go
- **WHEN** the person lifts their finger from the encoder
- **THEN** the cell shows the current choice alone

### Requirement: An address can be shown as a code image

The display SHALL be able to show an address as a code image a phone can scan, dark on a light ground with a clear margin in every pack and mode, with the address in text beside it; an address too long to draw SHALL be shown as text alone.

#### Scenario: A code for an address
- **WHEN** the app gives a dialog an address to show as a code
- **THEN** the display shows a code image that reads back as that address, and the address in text

#### Scenario: Scannable in a dark pack
- **WHEN** the code image is drawn in the push-3 pack in dark mode
- **THEN** its marks are dark on a light ground with a clear margin around them

#### Scenario: An address too long
- **WHEN** the app gives an address longer than the code can hold
- **THEN** the display shows the address as text and no code image

### Requirement: A value may carry a small picture

A setting's value SHALL be able to name a small picture, drawn under the value in the value's colour, and a value that names none SHALL be drawn as before.

#### Scenario: A value with a picture
- **WHEN** the app gives a setting's value with the picture of a finger
- **THEN** a finger is drawn under the value
