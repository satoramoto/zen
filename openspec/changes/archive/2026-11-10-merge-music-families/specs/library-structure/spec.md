## ADDED Requirements

### Requirement: Music is one area with one folder of components
Every music part SHALL live in the `music` area or its sub-area `music/live`. The token-drawn
parts and the mix[flow] toolkit's parts SHALL sit side by side in `music/components`, each in a
folder whose name no other part there has.

#### Scenario: A reader looks for a music part
- **WHEN** a reader looks for a fader, a pad, a readout or a toolkit control
- **THEN** it is a folder under `music/components/`, and its stories are under `Music/Components` in the sidebar

#### Scenario: Two parts had the same name
- **WHEN** a reader looks for the token-drawn knob, meter or transport
- **THEN** they are `KnobReadout`, `LevelMeter` and `TransportBar`, and `Knob`, `Meter` and `Transport` in that folder are the toolkit's

#### Scenario: An app imports a renamed part by its old name
- **WHEN** an app imports `Knob`, `Meter` or `Transport` from the package root
- **THEN** it gets the same token-drawn part as before the rename

### Requirement: Every music file is held to the component rules
The tier rules, the bindings-only rule and the token contract SHALL cover every file of the
`music` area. Findings the mix[flow] port already has SHALL be recorded and SHALL only go down.

#### Scenario: A token-drawn part gains a tier finding
- **WHEN** a token-drawn music part adds a literal pixel size, an outer margin or its own type
- **THEN** the tier check fails, as it did before the parts moved

#### Scenario: A new music file reads outside the contract
- **WHEN** a music file that is not on the port's excuse list reads a variable outside the token contract or writes a literal colour or radius
- **THEN** the contract check fails and names the file

#### Scenario: An excused file meets the contract
- **WHEN** a file on the port's excuse list no longer reads outside the contract
- **THEN** the contract check fails until the file is taken off the list
