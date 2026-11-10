# live-pane-registry Spec Delta

## ADDED Requirements

### Requirement: A pane is told what it needs to draw

The surface SHALL give the app’s pane, for each instance, the instance itself, the target it resolves to (its fixed target, else the app’s selection), its settings with every default filled in, the surface’s mode (editing or not, locked or not) and the form its room fits, and SHALL give them again whenever one changes.

#### Scenario: The mode reaches an app’s own pane
- **WHEN** a person turns editing on and then locks the tab, over a pane of the app’s own
- **THEN** the pane is told it is played, then built, then locked

#### Scenario: The form reaches an app’s own pane
- **WHEN** a pane of the app’s own with a wide and a narrow form is drawn in a window too narrow for the wide one
- **THEN** the pane is told its form is the narrow one

### Requirement: A target that is gone is said, not guessed

A region fixed to a target SHALL draw a note that its target is gone, in place of its pane, when its kind can be bound, the app says what its targets are and none of that kind has the binding’s id; the note SHALL still be movable, rebindable and removable in edit mode; and when the app gives no targets the pane SHALL be drawn with the target as written.

#### Scenario: A fixed target the app no longer offers
- **WHEN** a region is fixed to a track the app’s targets no longer include
- **THEN** the region shows a note that its target is gone in place of its pane, and the region beside it plays

#### Scenario: Rebinding it
- **WHEN** a person opens the tools of a region whose target is gone and binds it to a track the app offers
- **THEN** its bind control showed no target picked, and once the app applies the bind the pane is drawn on the new track

#### Scenario: No targets from the app
- **WHEN** the same region is drawn by an app that gives the surface no targets
- **THEN** its pane is drawn with the target as the document writes it
