# live-pane-registry Specification

## Purpose

How an app defines the pane kinds its surface can hold, how they reach the palette, and the ready-made Music live set.

## Requirements

### Requirement: The app defines its pane kinds

The surface SHALL take the app’s pane definitions as plain data, each naming its kind, its label, an optional description, its forms, its priority and whether it brings its own plate and head, and the binding targets it can follow, and SHALL draw each region in a slot the app fills for that instance.

#### Scenario: An app’s own pane
- **WHEN** an app defines a kind the surface has never seen and a tab holds an instance of it
- **THEN** the region shows the app’s content for that instance at a size from the kind’s own forms

#### Scenario: The slot knows its instance
- **WHEN** a tab holds two instances of one kind with different bindings
- **THEN** the app’s slot is asked for each instance with that instance’s id, title and resolved target

#### Scenario: Forms step down on a small window
- **WHEN** the surface is narrowed until a region’s widest form no longer fits
- **THEN** the region steps down to its next form, as the kind’s forms list them, and no region overflows

### Requirement: The palette is the app’s definitions

The palette in edit mode SHALL offer exactly the kinds the app defined, in the order given, each by its label and description.

#### Scenario: The palette lists the definitions
- **WHEN** a person opens the palette in edit mode
- **THEN** it lists every defined kind by its label, in the app’s order, and no other

#### Scenario: No definitions, no palette
- **WHEN** the app gives no pane definitions
- **THEN** edit mode offers no add and no palette, and still lets regions be moved and removed

### Requirement: The Music live panes are a ready-made set

Zen SHALL provide the Music live panes as one set of pane definitions an app may use whole, use in part, or combine with its own, and the live views SHALL be built from that set.

#### Scenario: The live views use the set
- **WHEN** the ONE tab of the live views is opened
- **THEN** every region on it is a Music live pane drawn from the ready-made set

#### Scenario: An app mixes the set with its own
- **WHEN** an app gives the surface the ready-made set plus one kind of its own
- **THEN** the palette lists every live pane and the app’s kind, and a tab can hold both

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
