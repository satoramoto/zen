# push-display Spec Delta

## ADDED Requirements

### Requirement: A choice shows the choices after it

A parameter that takes one of a list of choices SHALL show the current choice lit; a setting SHALL show the choices after it dim beneath it, and a parameter over a drawing SHALL show them dim beside it in a row.

#### Scenario: Choices beneath a setting
- **WHEN** the Expression tab shows Expression Mode at MPE
- **THEN** MPE is large and lit, with Poly Aftertouch and Mono Aftertouch dim beneath it

#### Scenario: Choices beside a parameter
- **WHEN** Device View shows a Simpler in Classic mode
- **THEN** Mode reads Classic lit, with One-Shot dim beside it on the same line

#### Scenario: The last choice
- **WHEN** a setting is at the last of its choices
- **THEN** it is shown alone

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

A setting's value SHALL be able to name a small picture, drawn under the value in the value's colour in place of a dial, and a value that names none SHALL be drawn as before.

#### Scenario: A value with a picture
- **WHEN** the app gives a setting's value with the picture of a finger
- **THEN** a finger is drawn under the value, in its colour, where a dial would be

## MODIFIED Requirements

### Requirement: A parameter cell shows a name, a value and a drawing

A parameter in a column SHALL show its name, its value with its unit as the app formats it, and a drawing that fits its kind: an arc for a continuous value, a centred arc for a bipolar one, the current choice at the large size for a choice, a switch for an on or off, and a bar for a level.

#### Scenario: A continuous parameter
- **WHEN** a column shows a filter frequency of 20.0 kHz
- **THEN** it reads its name, 20.0 kHz, and an arc filled to its place in the range

#### Scenario: A choice
- **WHEN** a column shows a parameter with four named choices
- **THEN** the current choice is shown alone at the large size

#### Scenario: A bipolar value
- **WHEN** a column shows a pan at centre
- **THEN** its arc is empty from the centre and reads C
