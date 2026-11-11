# Spec Delta

## MODIFIED Requirements

### Requirement: A parameter is mapped to a macro by touch

Touching a parameter's encoder SHALL offer Map; pressing it SHALL enter Macro Map mode, showing the Rack's macros in pages of eight, where touching a macro's encoder SHALL ask to map the parameter to that macro and Done SHALL leave; and a switch SHALL offer Map when its upper display button is held, a device's button standing for its on and off.

#### Scenario: Mapping a cutoff
- **WHEN** a person touches the encoder over a filter's frequency, presses Map and touches the third encoder
- **THEN** the app is asked to map that parameter to macro 3

#### Scenario: A second parameter on one macro
- **WHEN** macro 3 already has a mapping and a person maps another parameter to it
- **THEN** the app is asked to add the mapping, and the macro reads its default name once it holds two

#### Scenario: Holding a device's button
- **WHEN** a person holds the upper display button of a device inside a Rack
- **THEN** Map is offered for that device's on and off

#### Scenario: Mapping a device's switch
- **WHEN** a person holds a device's button, presses Map and touches the second encoder
- **THEN** the app is asked to map that device's on and off to macro 2

#### Scenario: A short press still switches
- **WHEN** a person presses and releases a selected device's button without holding it
- **THEN** Map is not offered
