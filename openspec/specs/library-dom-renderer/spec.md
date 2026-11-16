# library-dom-renderer Specification

## Purpose
Draws zen's view trees straight into the browser's DOM with no framework, so a page that is not a React or Svelte app can use zen's parts with the same markup and behaviour.

## Requirements

### Requirement: A part draws the same DOM in every renderer

A converted core part drawn by the DOM renderer SHALL produce the same elements, attributes and text as the React and Svelte renderers for every one of its fixtures.

#### Scenario: Every fixture matches across three renderers
- **WHEN** each fixture of a converted part is drawn by the React, Svelte and DOM renderers
- **THEN** the three DOMs are identical

### Requirement: The core parts are available by name

Every converted core control, and every primitive and layout those controls draw, SHALL be drawable by its registered name. A part that draws another SHALL draw it through the same registry.

#### Scenario: A composite draws its parts
- **WHEN** a Popover is drawn by name with the DOM renderer
- **THEN** the layer and surface it is made of are drawn too, as in the other renderers

#### Scenario: An unknown name is an error that says so
- **WHEN** a name that no part has is drawn
- **THEN** drawing fails with an error naming the part and where parts are registered

### Requirement: Behaviour is the part's own

A part drawn by the DOM renderer SHALL behave as it does in the other renderers: its handlers fire on the same events and its stores (long press, keys, popover placement) are applied to its elements.

#### Scenario: A select opens and picks with the keyboard
- **WHEN** a Select drawn by the DOM renderer is focused and the person presses ArrowDown then Enter
- **THEN** its change callback receives the next member's index

### Requirement: An update patches in place

Giving a mounted part new props SHALL update its existing elements rather than replace them, so focus, a press in progress and a store's state survive the update.

#### Scenario: Focus survives a new value
- **WHEN** a focused Segmented receives a new value
- **THEN** the same element keeps focus and the new segment reads as chosen

### Requirement: Destroying leaves nothing behind

Destroying a mounted part SHALL remove what it drew, destroy every store it applied and remove every listener it added, including anything it placed outside its element.

#### Scenario: An open popover is cleaned up
- **WHEN** a part with an open popover is destroyed
- **THEN** the popover's layer is gone from the document and no store or listener of it remains
