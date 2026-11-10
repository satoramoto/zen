# live-reference-kit Spec Delta

## ADDED Requirements

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
