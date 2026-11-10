# live-surface-document Spec Delta

## ADDED Requirements

### Requirement: A version 1 document draws

The surface SHALL draw a version 1 document (rows of region instance ids, the shape mix’s rig stores, with the app’s own region kinds) without conversion, as a column of its rows with each row’s regions taking equal shares, and an intent that changes a version 1 document SHALL be applied as on its version 2 reading, returning a version 2 document.

#### Scenario: An app’s own version 1 document, edited
- **WHEN** the surface is given mix’s rig document with mix’s region kinds and definitions for them, and a person edits it
- **THEN** every tab and region of it is drawn, and each edit made (choosing, adding, duplicating and removing a tab; moving, binding and adding a region; undo and redo) sends an intent mix’s store already has a method for

#### Scenario: Rows become a column of rows
- **WHEN** the surface is given mix’s version 1 default document
- **THEN** every tab draws its rows top to bottom and each row’s regions side by side in equal shares

#### Scenario: The first resize upgrades
- **WHEN** an app applies a resize intent to a version 1 document
- **THEN** the result is a version 2 document with the same regions and the new shares

## REMOVED Requirements

### Requirement: Mix’s rig documents fit unchanged

**Reason**: Merged into “A version 1 document draws”: mix’s rig document is the example of a version 1 document, not its definition.

**Migration**: Read “A version 1 document draws”.

### Requirement: Version 1 documents still draw

**Reason**: Merged into “A version 1 document draws”.

**Migration**: Read “A version 1 document draws”.
