# push-display Specification

## Purpose

The display's interface system: a 960 by 160 screen in eight columns that line up with the encoders and display buttons, its shared parts, and the rules every screen follows.

## Requirements

### Requirement: The display is a fixed grid of eight columns

The display SHALL be a 960 by 160 pixel screen at a 6 to 1 ratio, divided into eight equal columns, with a top row belonging to the upper display buttons, a bottom row belonging to the lower display buttons and a body between them, and SHALL scale as a whole with the surface.

#### Scenario: A column is an eighth
- **WHEN** the display is drawn at any size
- **THEN** each of its eight columns is one eighth of its width and sits under its encoder

#### Scenario: Scaling keeps the pixel grid
- **WHEN** the display is drawn at twice its size
- **THEN** every part is twice as large and nothing reflows

### Requirement: The display is drawn from plain data

The display SHALL draw a screen description given as plain data (which screen, and for each of its parts the text, values, colours and states), and SHALL be usable without the rest of the surface.

#### Scenario: A screen from JSON
- **WHEN** a screen description is written as JSON, read back and given to the display
- **THEN** the display draws the same screen

#### Scenario: The display alone
- **WHEN** an app draws the display with no surface around it
- **THEN** the screen is drawn the same as inside the surface

### Requirement: A display button's lamp matches what is above or below it

Each upper display button SHALL be lit in the colour and state of the item in the top row of its column, each lower display button likewise for the bottom row, and a button whose column has no item in its row SHALL be unlit.

#### Scenario: A track's button wears its colour
- **WHEN** the bottom row shows a pink track in column 2
- **THEN** lower display button 2 is lit pink

#### Scenario: Nothing to press
- **WHEN** the top row is empty in column 7
- **THEN** upper display button 7 is unlit and pressing it asks nothing

### Requirement: The selected item is a solid block

In the top and bottom rows the selected item SHALL be drawn as a solid block of its colour with dark text, and every other item as coloured text on the black ground.

#### Scenario: The selected track
- **WHEN** track 4 is selected
- **THEN** its name in the bottom row is a solid block of the track's colour and the other names are coloured text

### Requirement: A parameter cell shows a name, a value and a drawing

A parameter in a column SHALL show its name, its value with its unit as the app formats it, and a drawing that fits its kind: an arc for a continuous value, a centred arc for a bipolar one, a list with the current choice marked for a choice, a switch for an on or off, and a bar for a level.

#### Scenario: A continuous parameter
- **WHEN** a column shows a filter frequency of 20.0 kHz
- **THEN** it reads its name, 20.0 kHz, and an arc filled to its place in the range

#### Scenario: A choice
- **WHEN** a column shows a parameter with four named choices
- **THEN** the choices are listed with the current one marked

#### Scenario: A bipolar value
- **WHEN** a column shows a pan at centre
- **THEN** its arc is empty from the centre and reads C

### Requirement: A touched parameter stands out

A parameter whose encoder is touched SHALL be drawn emphasised, with its value at a larger size, until the encoder is released.

#### Scenario: Touch and release
- **WHEN** a person touches the encoder over a parameter and then lets go
- **THEN** the parameter is emphasised while touched and plain afterwards

### Requirement: A parameter may span columns

A screen SHALL be able to give one item more than one column, for a drawing that needs the room (an envelope, a filter curve, a waveform, an oscillator shape), with the parameters beside or over it still under their own encoders.

#### Scenario: An oscillator shape across four columns
- **WHEN** a device's bank gives its oscillator drawing columns 2 to 5
- **THEN** the drawing spans those columns and the parameter names above it stay in their own columns

### Requirement: Display elements take the colour of what they belong to

Controls on a screen that belongs to a track SHALL be drawn in the track's colour, those that belong to a clip in the clip's colour, and a screen that belongs to neither (Setup, Browse, Sets) in the neutral foreground.

#### Scenario: A device on a green track
- **WHEN** Device View shows a device on a green track
- **THEN** its values and arcs are green

#### Scenario: Setup
- **WHEN** the Setup menu is shown
- **THEN** its values and controls are white on black

### Requirement: Disabled and muted things are greyed

A parameter that cannot be changed now, a muted device's parameters and a muted track's controls SHALL be drawn greyed, and turning their encoders SHALL still be reported.

#### Scenario: A muted device
- **WHEN** a device is muted
- **THEN** all its parameters are grey

### Requirement: A row of tabs chooses a page

A screen with pages SHALL show them as a row of tabs in the top or bottom row, one per display button, with the current tab a solid block, and pressing a tab's button SHALL show its page.

#### Scenario: Choosing a tab
- **WHEN** the Setup menu shows Status and a person presses the lower display button under Audio
- **THEN** the Audio tab is the solid block and its page is shown

#### Scenario: A tab with news
- **WHEN** a software update is available
- **THEN** the Software tab's name carries an asterisk

### Requirement: More than eight items page sideways

When a row has more items than its columns, the display SHALL show arrows at the end of the row where more exist, and the buttons under the arrows SHALL move the row.

#### Scenario: Seven sends
- **WHEN** a Set has seven return tracks and the mix screen shows sends
- **THEN** an arrow is shown at the right end of the row and pressing its button brings the hidden sends into view

### Requirement: A list shows a highlight and its place

A list or menu on the display SHALL show one highlighted item as a solid bar, a chevron on an item that opens a sub-menu, the enclosing menus as columns to its left, and SHALL scroll to keep the highlight in view.

#### Scenario: A sub-menu
- **WHEN** a person opens the Device entry of the Add menu
- **THEN** the Add menu stays in its column with Device marked and the device categories are listed in the next column

#### Scenario: A long list
- **WHEN** the highlight moves below the last visible item of a list
- **THEN** the list scrolls so the highlighted item is visible

### Requirement: An X in the corner leaves

A screen that is entered and left (Browse, a menu, a dialog, text entry) SHALL show an X at the top left, and pressing the display button above it SHALL leave without choosing.

#### Scenario: Leaving Browse
- **WHEN** Browse Mode is shown and a person presses the upper display button over the X
- **THEN** the display returns to the screen it showed before

### Requirement: Text is entered with the jog wheel

The text entry screen SHALL show the text with a cursor and a row of characters; turning the jog wheel or the D-pad SHALL move through the characters, pressing SHALL type the highlighted one, nudging left or right SHALL move the cursor, and Delete, Space, Done and X SHALL be on display buttons.

#### Scenario: Typing a character
- **WHEN** the character k is highlighted and a person presses the jog wheel
- **THEN** k is inserted at the cursor

#### Scenario: Done
- **WHEN** a person presses the display button at Done
- **THEN** the app is asked to accept the text as typed

#### Scenario: Leaving without accepting
- **WHEN** a person presses the display button at X
- **THEN** the text entry closes and nothing is asked

### Requirement: A dialog shows a code or an address

The display SHALL be able to show a dialog with a web address, a six-digit code, or both, and a way to close it, for the steps a person finishes on another device.

#### Scenario: Pairing
- **WHEN** the app says pairing has begun with a code
- **THEN** the display shows the six digits and a way to cancel

### Requirement: A confirmation asks before removing

An action that deletes content (a Set, a preset, a Pack download, a Pack) SHALL show a confirmation that the jog wheel's press accepts and the X cancels.

#### Scenario: Cancelling a delete
- **WHEN** a delete confirmation is shown and a person presses the display button at X
- **THEN** nothing is asked of the app and the list is shown again

### Requirement: A notice overlays any screen

The display SHALL be able to show a short notice over the current screen (a value being set by the Volume or Swing & Tempo encoder, a range shown after an octave change, a scene's name, a message from the app) and SHALL remove it after a moment or when its control is released.

#### Scenario: An octave change
- **WHEN** a person presses Octave Up
- **THEN** the new note range is shown over the screen and goes away shortly after

### Requirement: Status marks sit over every screen

The display SHALL draw, over whatever screen is shown, a battery mark when the app reports the battery below 7 percent, a count-in bar across the top that moves and flashes with the beat during a count-in, and a progress bar for a long task the app reports.

#### Scenario: Low battery
- **WHEN** the app reports the battery at 5 percent while Device View is shown
- **THEN** a battery mark is drawn over Device View

#### Scenario: Count-in
- **WHEN** a one-bar count-in is running
- **THEN** a bar moves across the top of the display, flashing on each beat, and goes when recording starts

### Requirement: The bottom row is the track row on Set screens

On screens about the Set (Device, Mix, Clip, Session) the bottom row SHALL show the eight tracks in view, each in its colour with its name and an icon for its kind (an instrument Rack, a Drum Rack, a group, a return), with a circle on an armed track and a small bar under a track whose clip is playing showing how far through it is.

#### Scenario: An armed track
- **WHEN** track 5 is armed
- **THEN** a circle is shown beside its name in the bottom row

#### Scenario: A playing clip
- **WHEN** track 2's clip is halfway through its loop
- **THEN** the bar under track 2's name is half filled

#### Scenario: Return tracks
- **WHEN** a Set has two return tracks and six others
- **THEN** the returns are the last two names in the row, lettered A and B

### Requirement: A missing reading is shown as missing

A value the app does not give SHALL be drawn as absent, never as a made-up number.

#### Scenario: No level
- **WHEN** the app gives no level for a track's meter
- **THEN** the meter is drawn empty and marked as not measured

### Requirement: The display has an empty and a blank state

The display SHALL show a named empty state for a screen with nothing to show (no clip, no device, an empty Set) SHALL be blank when the unit is off, and in User Mode SHALL show only a notice that User Mode is active.

#### Scenario: No clip
- **WHEN** Clip View is opened on a track with no clip selected
- **THEN** the display reads No Clip

#### Scenario: User Mode
- **WHEN** the device is in User Mode
- **THEN** the display shows that User Mode is active and none of the built-in screens
