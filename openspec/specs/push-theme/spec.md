# push-theme Specification

## Purpose

The look of the device: a `push-3` theme pack that reproduces the unit from zen's tokens, the lamp colours that pads and buttons light in, and how any other pack recolours the whole device.

## Requirements

### Requirement: A push-3 pack reproduces the unit

Zen SHALL have a theme pack named `push-3` that names the Push 3 manual as its source and the rules it keeps, and under it the device SHALL read as the unit: a matte black body, dark controls with lit legends, translucent pads that glow from within, and a display of coloured type on a black ground.

#### Scenario: The pack is offered
- **WHEN** a person opens the theme picker
- **THEN** push-3 is among the packs it lists

#### Scenario: The pack names its source
- **WHEN** a person opens the theme inspector with push-3 chosen
- **THEN** it shows the manual as the pack's source and the rules the pack keeps

#### Scenario: The device in its own pack
- **WHEN** the assembled device is drawn in the push-3 pack in dark mode
- **THEN** the body is black, an unlit pad is a dark translucent square and a lit pad glows in its colour

### Requirement: Every part reads the contract

The surface's and display's parts SHALL take every colour, radius, type and spacing value from the theme contract or from the lamp colours, with no literal values of their own.

#### Scenario: The contract check
- **WHEN** the library's contract check scans the push area's stylesheets and components
- **THEN** it finds no literal colour or radius and no excuse listed for the area

### Requirement: Another pack recolours the whole device

Under any other pack the device SHALL keep its layout and behaviour and take that pack's surfaces, type, shape and materials, with lamps still plainly lit against the body.

#### Scenario: A light pack
- **WHEN** the device is drawn in a pack with a light ground
- **THEN** the body, buttons and legends take the pack's surfaces and type, and a lit pad is still clearly distinguishable from an unlit one

#### Scenario: Legible in every pack
- **WHEN** the device is drawn in each pack in light and dark mode
- **THEN** every legend and every display text meets the contrast the library holds its components to

### Requirement: The display may keep its own ground

The display SHALL be able to keep a dark screen whatever the pack's mode, as an option on by default, since it stands for a lit screen, and SHALL follow the pack's mode when the option is off.

#### Scenario: A light pack with the default
- **WHEN** the device is drawn in light mode with the option left on
- **THEN** the display is still light type on a dark ground

### Requirement: Lamp colours are one indexed table

The colours a pad, a display button, a scene button or a display element can take SHALL be one table indexed as the Set indexes track and clip colours, held with the themes, so the Set carries an index and never a colour value.

#### Scenario: A track colour by index
- **WHEN** the Set gives a track colour index and that index is given to a pad and to the track's name on the display
- **THEN** both are drawn in the same colour from the table

#### Scenario: An index outside the table
- **WHEN** a lamp is given an index the table does not have
- **THEN** it is drawn in the neutral lamp colour

### Requirement: The colour picker shows the table

When a colour is being chosen on the pads, the pads SHALL show the table's colours in a fixed order, one per pad, with the current colour marked.

#### Scenario: Choosing
- **WHEN** the track colours are shown on the pads for a track coloured teal
- **THEN** each pad shows one colour of the table and the teal pad is marked

### Requirement: State colours are named, not indexed

The colours that mean a state (playing green, recording red, selected white, soloed blue, empty grey, queued green) SHALL come from the pack's meaning colours, so a pack can restate them, and SHALL stay distinguishable from one another in every pack.

#### Scenario: Recording in another pack
- **WHEN** a recording step is drawn in a pack whose danger colour is orange-red
- **THEN** the step takes that pack's danger colour

### Requirement: Lit and dimmed versions are derived

The brighter, dimmer, lighter and darker versions of a lamp colour that the layouts call for (a muted pad, a higher velocity, a selected note) SHALL be derived from the one colour by rule, so every colour in the table has them.

#### Scenario: A muted pad of any colour
- **WHEN** pads of three different colours are muted
- **THEN** each is drawn as a darker version of its own colour

### Requirement: Light looks like light

A lit pad or button SHALL glow, with bloom around it where the pack's material allows, and brightness and bloom SHALL scale with the LED brightness setting.

#### Scenario: Bloom follows brightness
- **WHEN** LED brightness is lowered from 100 to 30 percent
- **THEN** lit pads are dimmer and their bloom is smaller

### Requirement: Motion can be reduced

When the person's system asks for reduced motion, pulsing and blinking lamps SHALL be shown as steady states that are still told apart from lit and from each other.

#### Scenario: Reduced motion
- **WHEN** reduced motion is asked for and a pad is given a blinking lamp
- **THEN** the pad does not animate and carries a mark that tells it from a steadily lit pad

### Requirement: The display has its own type scale

The display SHALL set its text in the pack's faces at sizes fixed to the 160-pixel screen (a label size, a value size and a large value size), so text sits on the same lines as on the unit at any scale.

#### Scenario: A large value
- **WHEN** a touched parameter shows its value large
- **THEN** it is set at the display's large value size and its label at the label size
