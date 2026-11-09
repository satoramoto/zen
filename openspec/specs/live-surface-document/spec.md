# live-surface-document Specification

## Purpose

The document an app owns and the surface draws: its shape, its version, and how the surface treats an id or kind it doesn’t know.

## Requirements

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

### Requirement: Kinds are named, never inferred

The surface SHALL read each region’s pane kind from the instance’s `kind` alone, never from its id, so that two instances of one kind and instances with any ids draw correctly.

#### Scenario: Two instances of one kind on one tab
- **WHEN** a tab holds two instances of the same kind, bound to different targets
- **THEN** both are drawn, each with its own title and its own target

#### Scenario: An id that looks like another kind
- **WHEN** an instance whose id is `mix-1` has the kind `stems`
- **THEN** it is drawn as a stems pane

### Requirement: What the surface doesn’t know is drawn, not dropped

The surface SHALL draw a region whose kind the app has not defined as a placeholder that names the kind and can still be moved and removed in edit mode, and SHALL skip a row entry naming an instance the tab doesn’t hold without failing the rest of the tab.

#### Scenario: An unknown kind
- **WHEN** a document names a kind the app gave no definition for
- **THEN** that region shows a placeholder naming the unknown kind and the rest of the tab draws normally
- **AND** in edit mode the placeholder can still be moved and removed

#### Scenario: A dangling instance id
- **WHEN** a tab’s row names an instance id the tab doesn’t hold
- **THEN** the row draws its other regions and nothing is drawn for the missing one

#### Scenario: An open tab id no tab has
- **WHEN** the document’s open tab id matches no tab
- **THEN** the surface shows the first tab

### Requirement: Mix’s rig documents fit unchanged

The surface SHALL accept a document in exactly the shape mix’s rig stores (its version 1 surface document and its own region kinds), without conversion.

#### Scenario: Mix’s default document
- **WHEN** the surface is given a document in mix’s shape with mix’s region kinds and definitions for them
- **THEN** every tab and region of it is drawn, and every edit it offers sends an intent mix’s store has a method for, retitling a region aside

### Requirement: Version 1 documents still draw

The surface SHALL draw a version 1 document (rows of region instance ids) as a column of its rows, each row’s regions taking equal shares, and an intent that changes the layout of a version 1 document SHALL be applied as on its version 2 reading.

#### Scenario: Mix’s document today
- **WHEN** the surface is given mix’s version 1 default document
- **THEN** every tab draws as before, its rows top to bottom and each row’s regions side by side in equal shares

#### Scenario: The first resize upgrades
- **WHEN** an app applies a resize intent to a version 1 document
- **THEN** the result is a version 2 document with the same regions and the new shares
