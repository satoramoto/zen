# Spec Delta

## MODIFIED Requirements

### Requirement: Expression sets how the pads bend and press

The Expression tab SHALL set the Expression Mode (MPE, Poly Aftertouch, Mono Aftertouch) and, in MPE, Note Pitch Bend (automatic, On, Off), In Tune Location (Finger, Pad) with a picture of the one chosen, In Tune Width (0 to 20 mm) and Slide Height (10 to 16 mm).

#### Scenario: Poly Aftertouch hides the MPE options
- **WHEN** the Expression Mode is Poly Aftertouch
- **THEN** the pitch bend and slide settings are not offered

#### Scenario: A wider in-tune zone
- **WHEN** a person turns In Tune Width to 15 mm
- **THEN** the app is asked to set the in-tune width to 15 mm

#### Scenario: Where in tune is
- **WHEN** In Tune Location is Finger
- **THEN** a finger is drawn under it, and a pad when it is Pad

### Requirement: MIDI sets each port

The MIDI tab SHALL list the ports the app reports (the MIDI In and Out jacks and each USB device), switch between a port's Input and Output with an encoder and show the sign of the one chosen, and offer Track, Sync, Remote and (for inputs) MPE as switches, with External Sync and Sync Delay available when an input's Sync is on.

#### Scenario: Clock out
- **WHEN** a person selects a port's Output and presses the display button at Sync
- **THEN** the app is asked to send MIDI clock to that port

#### Scenario: External Sync
- **WHEN** no input has Sync on
- **THEN** External Sync is greyed

#### Scenario: Input or output
- **WHEN** a person turns the encoder from a port's Input to its Output
- **THEN** the sign under it changes from the input's to the output's

### Requirement: Learn lists lessons

Pressing Learn SHALL show the lessons the app lists, opened with the jog wheel and paged with display buttons, and a code image linking to further material when the app gives one.

#### Scenario: A lesson
- **WHEN** a person presses Learn and chooses the first lesson
- **THEN** the lesson's first page is shown with a way to go to the next

#### Scenario: Further material
- **WHEN** a lesson's page has a link to further material
- **THEN** the page shows a code image that reads back as the link's address

#### Scenario: A lesson with no link
- **WHEN** a lesson's page has no link
- **THEN** no code image is shown
