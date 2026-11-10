# live-reference-kit Specification

## Purpose

The Music live panes as a ready-made set an app may use whole, in part or beside its own, the settings they declare, and the whole DAWs composed from them.

## Requirements

### Requirement: Whole DAWs are composed from the kit

Zen SHALL show whole DAWs composed from the reference kit alone, each a surface document built through the surface’s own intents and drawn by one linked host, in its own pack and at the window size it is made for; in each, every region SHALL draw a pane of the kit with none cramped, and the DAW SHALL be played as it stands.

#### Scenario: The dub desk
- **WHEN** the dub desk is opened at 1440 × 900 and a person flips Freeze on its bank of sends
- **THEN** every region draws a kit pane with none cramped, and the Freeze switch reads on once the host moves the parameter

#### Scenario: The orbit lab
- **WHEN** the orbit lab is opened at 1440 × 900 and a person selects Bass in one of its orbit clocks
- **THEN** every region draws a kit pane with none cramped, the dice now aim at Bass, and the two clocks stay on Drums and Keys, the tracks they are fixed to

#### Scenario: The stem booth
- **WHEN** the stem booth is opened at 1440 × 900 and a person mutes the bass stem and queues the bridge
- **THEN** every region draws a kit pane with none cramped, the deck shows a lane per stem with the bass muted, and the bridge reads queued

#### Scenario: The pocket remote
- **WHEN** the pocket remote is opened at 390 × 780, a phone’s window, and a person presses JAM
- **THEN** every region draws a kit pane with none cramped and nothing runs off the side, and the song card reads jamming

### Requirement: The Music live panes are a ready-made set

Zen SHALL provide the Music live panes as one set of pane definitions an app may use whole, use in part, or combine with its own, and the live views SHALL be built from that set.

#### Scenario: The live views use the set
- **WHEN** the ONE tab of the live views is opened
- **THEN** every region on it is a Music live pane drawn from the ready-made set

#### Scenario: An app mixes the set with its own
- **WHEN** an app gives the surface the ready-made set plus one kind of its own
- **THEN** the palette lists every live pane and the app’s kind, and a tab can hold both

### Requirement: The live panes declare their settings

The Music live panes SHALL declare the settings their own props already allow (which tracks a pane shows, which pads or moves it offers), and a surface built from the set SHALL draw each pane from its region’s settings.

#### Scenario: The strips follow their settings
- **WHEN** a track strips region’s settings name two tracks
- **THEN** the strips draw those two tracks and their returns, and nothing else
