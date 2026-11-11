# push-browser Specification

## Purpose

Finding and managing content on the device: Browse Mode for adding tracks and devices, Hot-Swap Mode, sound preview, Collections, Packs, the Set Library, and saving, renaming and deleting Sets and presets.

## Requirements

### Requirement: Add opens Browse Mode

Pressing Add SHALL show Browse Mode: an Add menu offering Device, MIDI Track, Audio Track and Return Track, an X at the top left to leave, Preview and Favorites on upper display buttons and Packs at the top right.

#### Scenario: The Add menu
- **WHEN** a person presses Add
- **THEN** the display lists Device, MIDI Track, Audio Track and Return Track with Device highlighted

### Requirement: The browser shows what the app lists

The browser SHALL show the tree of content the Set gives (categories, folders, Packs, the User Library, the current project), each level a column, and SHALL ask the app for a folder's contents when it is opened and show that it is loading until they arrive.

#### Scenario: Opening a category
- **WHEN** a person highlights Drums and presses the jog wheel
- **THEN** the app is asked for the contents of Drums and they are listed in the next column once given

#### Scenario: Waiting
- **WHEN** a folder has been opened and the app has not yet given its contents
- **THEN** the column shows that it is loading

### Requirement: Choosing a device loads it and leaves

In Browse Mode, pressing the jog wheel or the D-pad's centre on a device or preset SHALL ask to load it onto the selected track and return to Device View.

#### Scenario: Loading a preset
- **WHEN** a preset is highlighted and a person presses the jog wheel
- **THEN** the app is asked to load it and the display shows Device View

### Requirement: A track is added with or without a device

Choosing MIDI Track, Audio Track or Return Track SHALL offer a default track of that kind and the sounds and devices that suit it, and choosing either SHALL ask the app to add the track.

#### Scenario: A default MIDI track
- **WHEN** a person opens MIDI Track and chooses the default track
- **THEN** the app is asked to add an empty MIDI track

### Requirement: The first encoder steps back through the path

While in a sub-menu, the first encoder SHALL move between the menus already opened, and nudging the jog wheel left SHALL go back one.

#### Scenario: Back two levels
- **WHEN** a person is three menus deep and turns the first encoder two steps anticlockwise
- **THEN** the first menu has the highlight

### Requirement: Preview plays what is highlighted

The Preview display button SHALL switch preview on and off, off by default, and with it on, each newly highlighted item that can be previewed SHALL ask the app to play its preview.

#### Scenario: Preview on
- **WHEN** Preview is on and a person moves the highlight to another preset
- **THEN** the app is asked to preview that preset

### Requirement: Favorites and Collections label content

The Favorites display button SHALL ask to add the highlighted item to the Favorites label or remove it, the encoder above it SHALL choose another Collections label to use in its place, and the labels SHALL be listed in the Device menu.

#### Scenario: Marking a favourite
- **WHEN** a preset is highlighted and a person presses the display button at Favorites
- **THEN** the app is asked to add it to Favorites, and the button shows it as marked once the app does

### Requirement: Swap opens Hot-Swap Mode in the right place

Pressing Swap SHALL show the browser at the folder the selected device, drum pad or sample came from; choosing an item SHALL ask to replace the selection with it and stay in Hot-Swap Mode; and Swap again, or the display button over the device's name, SHALL leave.

#### Scenario: Swapping a bass preset
- **WHEN** a bass preset is selected and a person presses Swap
- **THEN** the browser shows the folder of bass presets with the current one highlighted

#### Scenario: Staying in
- **WHEN** a person chooses another preset in Hot-Swap Mode
- **THEN** the app is asked to replace the device and the browser stays open

### Requirement: Load Next and Load Previous step through presets

In Hot-Swap Mode, Load Next and Load Previous on display buttons SHALL ask to replace the selection with the next or previous item in the list.

#### Scenario: The next preset
- **WHEN** Hot-Swap Mode is open and a person presses the display button at Load Next
- **THEN** the app is asked to load the item after the current one and the highlight moves to it

### Requirement: A single drum pad is swapped

With a Drum Rack pad selected, Swap SHALL open at that pad's sound's category, the pad SHALL blink on the grid, and tapping another pad SHALL retarget the swap to it and update the folder shown.

#### Scenario: A kick
- **WHEN** a pad holding a kick is selected and a person presses Swap
- **THEN** the browser shows the Kick category and that pad blinks

### Requirement: The pads still play while swapping

In Hot-Swap Mode the pads SHALL keep playing the selected instrument so a sound can be tried.

#### Scenario: Trying a sound
- **WHEN** Hot-Swap Mode is open and a person presses a pad
- **THEN** a note is reported as in the layout before

### Requirement: Packs are listed, downloaded and installed

The Packs display button SHALL show installed Packs and Available Packs; choosing an available Pack SHALL ask to download it, with its progress shown; pressing again SHALL ask to pause; pressing a downloaded Pack SHALL ask to install it, with Cancel on a display button.

#### Scenario: Downloading
- **WHEN** a person chooses a Pack under Available Packs
- **THEN** the app is asked to download it and the row shows the progress the app reports

#### Scenario: Pausing
- **WHEN** a Pack is downloading and a person presses the jog wheel on it
- **THEN** the app is asked to pause the download

### Requirement: Packs need a connection

When the Set says Wi-Fi is not connected, Available Packs SHALL say so and offer no downloads.

#### Scenario: Offline
- **WHEN** Wi-Fi is off and a person opens Available Packs
- **THEN** the display says a Wi-Fi connection is needed

### Requirement: A Pack's download or installation is removed

Nudging the jog wheel right on a paused or uninstalled download SHALL offer Delete Download, and on an installed Pack SHALL offer Uninstall, each confirmed with the jog wheel's press and cancelled with the X.

#### Scenario: Uninstalling
- **WHEN** an installed Pack is highlighted and a person nudges right and presses the jog wheel
- **THEN** the app is asked to uninstall that Pack

### Requirement: Sets opens the Set Library

Pressing Sets SHALL show the saved Sets as a list with + New Set on a display button; choosing one SHALL ask to open it; in Control Mode the list SHALL be the recent and demo Sets the app gives.

#### Scenario: Opening a Set
- **WHEN** a person highlights a Set and presses the jog wheel
- **THEN** the app is asked to open that Set

#### Scenario: A new Set
- **WHEN** a person presses the display button at + New Set
- **THEN** the app is asked for a new empty Set

### Requirement: A new Set from the surface

Holding the Session button below the D-pad and pressing New SHALL ask for a new empty Set.

#### Scenario: Session and New
- **WHEN** a person holds Session and presses New
- **THEN** the app is asked for a new Set and no clip slot is prepared

### Requirement: Sets are sorted by date or name

In the Set Library the third encoder SHALL choose sorting by date or by name and the display button under it SHALL switch between ascending and descending, with the most recently changed first by default.

#### Scenario: By name
- **WHEN** a person turns the third encoder to Name
- **THEN** the Sets are listed in alphabetical order

### Requirement: Cloud Sets have their own label

When the Set says Ableton Cloud is active, the Set Library SHALL show a Cloud label listing the synced Sets.

#### Scenario: Cloud on
- **WHEN** Cloud is active with two synced Sets
- **THEN** the Set Library shows the Cloud label and the two Sets under it

### Requirement: Save has three forms

Pressing Save SHALL ask to save the Set; Shift with Save SHALL ask to save it as a new version in the same project; and Duplicate with Save SHALL ask to save it as a new project.

#### Scenario: A new version
- **WHEN** a person holds Shift and presses Save
- **THEN** the app is asked to save a new version of the Set in its project

#### Scenario: A new project
- **WHEN** a person holds Duplicate and presses Save
- **THEN** the app is asked to save the Set as a new project

### Requirement: Stored content is renamed and deleted from its menu

Nudging the jog wheel right on a Set or a user preset SHALL show its menu of Delete and Rename; Rename SHALL open text entry with its name; and Delete SHALL ask for confirmation before the app is asked.

#### Scenario: Renaming a Set
- **WHEN** a person chooses Rename on a Set, types a name and presses Done
- **THEN** the app is asked to rename that Set to the typed name

#### Scenario: Content that cannot be changed
- **WHEN** a factory preset is highlighted and a person nudges the jog wheel right
- **THEN** no Delete or Rename is offered

### Requirement: The browser remembers where it was

Reopening Browse Mode SHALL show the folder and highlight it had when it was last left.

#### Scenario: Coming back
- **WHEN** a person leaves Browse Mode inside Drums and presses Add again
- **THEN** the browser shows Drums with the same item highlighted
