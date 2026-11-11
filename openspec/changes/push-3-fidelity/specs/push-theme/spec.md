# push-theme Spec Delta

## MODIFIED Requirements

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
