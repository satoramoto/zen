# push-device-view Spec Delta

## ADDED Requirements

### Requirement: A bank's switches sit over the upper display buttons

While a device's banks are shown, the top row SHALL show that device alone over the first upper display button and the bank's switches over the others; pressing a switch's button SHALL ask to switch it, and pressing the device's SHALL return the top row to the devices.

#### Scenario: A bank's switches
- **WHEN** a person presses the selected device's button
- **THEN** the top row shows that device alone, then the bank's switches, and the bottom row its banks

#### Scenario: Switching
- **WHEN** a device's banks are shown and a person presses the display button at a switch that is on
- **THEN** the app is asked to switch it off, and Map is not offered

#### Scenario: Back to the devices
- **WHEN** a device's banks are shown and a person presses the first upper display button
- **THEN** the top row shows the track's devices again

## MODIFIED Requirements

### Requirement: A parameter is mapped to a macro by touch

Touching a parameter's encoder SHALL offer Map on the last lower display button; pressing it SHALL enter Macro Map mode, showing the Rack's macros in pages of eight, where touching a macro's encoder SHALL ask to map the parameter to that macro and Done SHALL leave; and a switch SHALL offer Map when its upper display button is held.

#### Scenario: Mapping a cutoff
- **WHEN** a person touches the encoder over a filter's frequency, presses Map and touches the third encoder
- **THEN** the app is asked to map that parameter to macro 3

#### Scenario: A second parameter on one macro
- **WHEN** macro 3 already has a mapping and a person maps another parameter to it
- **THEN** the app is asked to add the mapping, and the macro reads its default name once it holds two

#### Scenario: Holding a switch's button
- **WHEN** a device in a Rack shows its banks and a person holds the display button at one of its switches
- **THEN** Map is offered on the last lower display button

#### Scenario: Mapping a switch
- **WHEN** a person holds a switch's button, presses Map and touches the second encoder
- **THEN** the app is asked to map that switch to macro 2
