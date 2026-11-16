# library-hotwire Specification

## Purpose
Lets a server-rendered app built with Turbo and Stimulus, such as a standard Rails 8 app, place zen's parts in its HTML and have them drawn, updated and removed in the browser as Turbo moves the page, with no Node at run time.

## Requirements

### Requirement: A placeholder in the HTML becomes the part

An element that names a part and carries its props as JSON SHALL be drawn as that part when it enters the document, by any route: the first page load, a Turbo visit, a frame or a stream.

#### Scenario: A part loads in a lazy frame
- **WHEN** a lazy Turbo frame loads HTML holding a Select placeholder
- **THEN** a Select is drawn in the frame with the placeholder's members and value

#### Scenario: A part arrives in a stream
- **WHEN** a Turbo stream replaces an element with HTML holding a Button placeholder
- **THEN** the Button is drawn where the element was

### Requirement: A part removed from the page is destroyed

A drawn part SHALL be destroyed when its element leaves the document, whether a frame, a stream or a visit removed it.

#### Scenario: A frame replaces its contents
- **WHEN** a frame holding a part with an open menu loads new contents
- **THEN** the part and its menu are gone and nothing of it remains in the document

### Requirement: New props update the part in place

Changing a placeholder's props attribute SHALL update the drawn part in place.

#### Scenario: The server sends a new value
- **WHEN** a placeholder's props are changed to a new value while it is drawn
- **THEN** the part shows the new value and keeps focus if it had it

### Requirement: A morph keeps the drawn part

A Turbo morph of the page SHALL not wipe a drawn part back to its placeholder; the part takes the morphed placeholder's props in place.

#### Scenario: A page refresh morphs
- **WHEN** a page with a focused Select is refreshed by morphing and the server's value differs
- **THEN** the Select is still drawn, still focused, and shows the server's value

### Requirement: The page cache holds no stale part

A page restored from Turbo's cache SHALL draw its parts afresh from their placeholders, never show the drawing taken when it was cached as if it were live.

#### Scenario: Back to a cached page
- **WHEN** the person visits another page and goes back
- **THEN** each part is drawn once, works, and has no duplicate beside it

### Requirement: Callbacks are DOM events

A part's callbacks SHALL be dispatched as bubbling events on its placeholder, named for the callback, with the callback's arguments in the event's detail.

#### Scenario: A Stimulus action hears a change
- **WHEN** a Select's member is chosen inside an element whose action listens for `zen:change`
- **THEN** the action runs with the chosen index in the event's detail

### Requirement: A part with a value is a form field

A part given a field name SHALL keep a named form value in step with what it shows and announce a change as a native field does, so a server form submits it and existing change handlers run.

#### Scenario: A filter form submits the chosen value
- **WHEN** a Select named `basis` is changed inside a form whose actions listen for `change`
- **THEN** the form's `change` actions run with `basis` and the chosen value, and submitting it sends them

#### Scenario: A choice is kept without the server
- **WHEN** a value part is changed and the server sends nothing back
- **THEN** the part shows the new value

### Requirement: Slots are filled from server HTML

A part's slots SHALL be fillable with markup the server wrote inside its placeholder.

#### Scenario: A button with a server-rendered icon
- **WHEN** a Button placeholder holds a template for its icon slot with an SVG
- **THEN** the Button draws that SVG in its icon place

### Requirement: A theme scope from markup

An element marked with a pack and a mode SHALL be scoped to that pack's theme, following the system's light or dark setting when the mode says so.

#### Scenario: The system turns dark
- **WHEN** the scope's mode follows the system and the system switches to dark
- **THEN** the scoped element's colours switch to the pack's dark ones without a reload
