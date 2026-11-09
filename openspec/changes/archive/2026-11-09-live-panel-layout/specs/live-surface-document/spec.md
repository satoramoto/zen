# live-surface-document Spec Delta

## ADDED Requirements

### Requirement: Version 1 documents still draw

The surface SHALL draw a version 1 document (rows of region instance ids) as a column of its rows, each row’s regions taking equal shares, and an intent that changes the layout of a version 1 document SHALL be applied as on its version 2 reading.

#### Scenario: Mix’s document today
- **WHEN** the surface is given mix’s version 1 default document
- **THEN** every tab draws as before, its rows top to bottom and each row’s regions side by side in equal shares

#### Scenario: The first resize upgrades
- **WHEN** an app applies a resize intent to a version 1 document
- **THEN** the result is a version 2 document with the same regions and the new shares

## MODIFIED Requirements

### Requirement: The app owns the surface document

The surface SHALL draw the surface document it is given, a version 2 value of tabs, each tab a layout tree of splits and region instance ids, the instances (each with its own id, a pane kind, a title, a binding and its settings) and whether the tab is locked, and the open tab’s id, and SHALL never store, save or alter that document itself.

#### Scenario: The surface draws the app’s document
- **WHEN** an app gives the surface a document with three tabs and opens the second
- **THEN** the tab strip shows the three titles with the second selected and its regions drawn in its layout, in order

#### Scenario: A new document replaces the old
- **WHEN** the app gives the surface a different document in place of the first
- **THEN** the surface draws the new tabs and regions and nothing of the old one remains

#### Scenario: An edit leaves the document as given until the app applies it
- **WHEN** a person removes a region in edit mode and the app does not apply the edit
- **THEN** the region is still drawn where it was
