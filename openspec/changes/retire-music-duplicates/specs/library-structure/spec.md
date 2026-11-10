## MODIFIED Requirements

### Requirement: Music is one area with one folder of components
Every music part SHALL live in the `music` area or its sub-area `music/live`. The token-drawn
parts and the mix[flow] toolkit's parts SHALL sit side by side in `music/components`, each in a
folder whose name no other part there has. The area SHALL hold one meter and one transport, the
toolkit's.

#### Scenario: A reader looks for a music part
- **WHEN** a reader looks for a fader, a pad, a readout or a toolkit control
- **THEN** it is a folder under `music/components/`, and its stories are under `Music/Components` in the sidebar

#### Scenario: A reader looks for the meter or the transport
- **WHEN** a reader looks for a level meter or a transport
- **THEN** there is one of each, `Meter` and `Transport`, and they are the toolkit's

#### Scenario: A token-drawn part shows a level
- **WHEN** a token-drawn part such as the mix band shows a level, or a screen such as Yahaha's Show shows a transport
- **THEN** it draws the toolkit's meter or transport inside the toolkit's scope

#### Scenario: The two knobs
- **WHEN** a reader looks for the token-drawn knob
- **THEN** it is `KnobReadout`, and `Knob` in that folder is the toolkit's

#### Scenario: An app imports the token-drawn knob by its old name
- **WHEN** an app imports `Knob` from the package root
- **THEN** it gets the token-drawn `KnobReadout`
