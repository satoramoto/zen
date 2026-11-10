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

The surface SHALL draw a region whose kind the app has not defined as a placeholder that names the kind and can still be moved and removed in edit mode; SHALL skip a layout leaf naming an instance the tab doesn’t hold without failing the rest of the tab; SHALL draw an instance the layout names twice once, at its first place; and SHALL keep, without drawing it, an instance no leaf names.

#### Scenario: An unknown kind
- **WHEN** a document names a kind the app gave no definition for
- **THEN** that region shows a placeholder naming the unknown kind and the rest of the tab draws normally
- **AND** in edit mode the placeholder can still be moved and removed

#### Scenario: A dangling instance id
- **WHEN** a tab’s layout names an instance id the tab doesn’t hold
- **THEN** the tab draws its other regions and nothing is drawn for the missing one

#### Scenario: An open tab id no tab has
- **WHEN** the document’s open tab id matches no tab
- **THEN** the surface shows the first tab

#### Scenario: A leaf named twice
- **WHEN** a tab’s layout names the same instance in two places
- **THEN** the instance is drawn once, at its first place, and the rest of the tab draws normally

#### Scenario: An instance no leaf names
- **WHEN** a tab holds an instance its layout doesn’t name
- **THEN** the instance is not drawn and is still in the document after another region is edited

### Requirement: Mix’s rig documents fit unchanged

The surface SHALL accept a document in exactly the shape mix’s rig stores (its version 1 surface document and its own region kinds), without conversion.

#### Scenario: Mix’s default document
- **WHEN** the surface is given mix’s rig document with mix’s region kinds and definitions for them, and a person edits it
- **THEN** every tab and region of it is drawn, and each edit made (choosing, adding, duplicating and removing a tab; moving, binding and adding a region; undo and redo) sends an intent mix’s store already has a method for

### Requirement: Version 1 documents still draw

The surface SHALL draw a version 1 document (rows of region instance ids) as a column of its rows, each row’s regions taking equal shares, and an intent that changes a version 1 document SHALL be applied as on its version 2 reading, returning a version 2 document.

#### Scenario: Mix’s document today
- **WHEN** the surface is given mix’s version 1 default document
- **THEN** every tab draws its rows top to bottom and each row’s regions side by side in equal shares

#### Scenario: The first resize upgrades
- **WHEN** an app applies a resize intent to a version 1 document
- **THEN** the result is a version 2 document with the same regions and the new shares

### Requirement: A version the surface doesn’t read is not drawn

The surface SHALL draw a document whose version it doesn’t read (any but 1 and 2) as a notice naming that version, with no tabs, regions or tools, SHALL send no intent for it, and the pure applier SHALL return such a document as given.

#### Scenario: A newer document
- **WHEN** the surface is given a version 3 document
- **THEN** it shows a notice that the surface was saved by a newer version (3), and no tab, region or tool

#### Scenario: Nothing edits a newer document
- **WHEN** an app applies intents to a version 3 document
- **THEN** the applier returns the very document it was given each time

### Requirement: Fields the surface doesn’t know are kept

The surface and the pure applier SHALL carry every field they don’t know, on the document, a tab or an instance, through every reading and edit unchanged, so an app can keep its own data in the document.

#### Scenario: An app’s own fields survive an edit
- **WHEN** an app keeps a field of its own on the document, on a tab and on an instance, then applies a rename and a duplicate
- **THEN** all three fields are still there, and the duplicated tab and its instances carry them too

#### Scenario: A version 1 document’s own fields
- **WHEN** a version 1 document with a field of the app’s own on it and on a tab is upgraded by a resize
- **THEN** the version 2 result still carries both fields

### Requirement: A saved document can be checked

Zen SHALL provide a pure function that lists a document’s problems as plain data (a version it doesn’t read, an open tab id no tab has, a repeated tab or instance id, a leaf naming no instance, an instance no leaf names, a leaf named twice, a share that isn’t positive), and that repairs nothing.

#### Scenario: A saved document with problems
- **WHEN** an app checks a document whose layout names one instance twice and leaves another out
- **THEN** the check lists a repeated leaf and an orphan instance, each with its tab and id, and the document is as it was

#### Scenario: A sound document
- **WHEN** an app checks a document with nothing wrong, in either version
- **THEN** the check lists nothing
