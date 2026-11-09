# live-pane-registry Spec Delta

## Purpose

How an app defines the pane kinds its surface can hold, how they reach the palette, and the ready-made Music live set.

## ADDED Requirements

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

Zen SHALL provide the sixteen Music live panes as one set of pane definitions an app may use whole, use in part, or combine with its own, and the live views SHALL be built from that set.

#### Scenario: The live views use the set
- **WHEN** the ONE tab of the live views is opened
- **THEN** every region on it is a Music live pane drawn from the ready-made set

#### Scenario: An app mixes the set with its own
- **WHEN** an app gives the surface the ready-made set plus one kind of its own
- **THEN** the palette lists the sixteen live panes and the app’s kind, and a tab can hold both
