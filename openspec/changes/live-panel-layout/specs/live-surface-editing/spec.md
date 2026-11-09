## MODIFIED Requirements

### Requirement: Every edit leaves as one intent

Every change a person makes through the surface SHALL leave it as exactly one intent naming the edit and its target: choosing, adding, renaming, duplicating, removing, locking or unlocking a tab; adding, removing, moving (left, right, up, down), docking, retitling, rebinding or configuring a region; resizing a split; and undo and redo.

#### Scenario: Choosing a tab
- **WHEN** a person chooses the third tab
- **THEN** the surface sends one intent to select that tab and shows it only once the app’s document opens it

#### Scenario: Moving a region
- **WHEN** a person moves a region one place to the right in edit mode
- **THEN** the surface sends one move intent naming the tab, the region and the direction

#### Scenario: Adding from the palette
- **WHEN** a person adds a kind from the palette beside a region
- **THEN** the surface sends one add intent naming the tab, the kind and where it goes, and the app picks the new instance’s id

#### Scenario: Rebinding a region
- **WHEN** a person binds a region to a fixed target from the targets the app offers
- **THEN** the surface sends one bind intent naming the tab, the region and the fixed binding

#### Scenario: Renaming a tab
- **WHEN** a person renames a tab and confirms
- **THEN** the surface sends one rename intent with the new title, and cancelling sends nothing

## ADDED Requirements

### Requirement: Layout intents apply without a store

The pure applier SHALL apply the resize, dock, configure and lock intents as it applies the others, returning the next version 2 document, and the document unchanged for an intent naming a split, region or tab it doesn't hold.

#### Scenario: Docking through the applier
- **WHEN** a story applies a dock intent placing one region below another
- **THEN** the returned layout holds a column of the two where the target was, and the region is gone from where it was

#### Scenario: A resize naming no split
- **WHEN** a resize intent names a split the tab doesn't hold
- **THEN** the applier returns the document unchanged
