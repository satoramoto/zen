# Spec Delta

## Purpose

Device View: the selected track's chain of devices on the display, their parameter banks under the encoders, Racks with their chains, drum pads and macros, and acting on devices from the surface.

## ADDED Requirements

### Requirement: Device View shows the track's devices and one device's parameters

Pressing Device SHALL show the selected track's devices in order along the top row, the selected one a solid block, with up to eight of its parameters in the body, one per column under its encoder.

#### Scenario: A loaded instrument
- **WHEN** Device View is opened on a track holding one synthesizer
- **THEN** its name is the solid block in the top row and eight of its parameters are shown with their values

#### Scenario: Choosing another device
- **WHEN** a track has an instrument and a reverb and a person presses the upper display button over the reverb
- **THEN** the reverb is the solid block and its parameters are shown

### Requirement: An encoder asks to change its parameter

Turning an encoder in Device View SHALL ask the app to change the parameter in its column by an amount that fits the parameter's range, finer with Shift, one choice per step for a parameter of choices, and on or off for a switch.

#### Scenario: A filter sweep
- **WHEN** a person turns the encoder over a filter's frequency clockwise
- **THEN** the app is asked to raise that parameter and the display reads the value the app gives back

#### Scenario: A choice
- **WHEN** a person turns the encoder over an oscillator's waveform choice one step
- **THEN** the app is asked for the next waveform

### Requirement: A device's parameters are in named banks

Pressing the upper display button of the selected device SHALL show the device's parameter banks as tabs in the bottom row, the lower display buttons SHALL choose a bank, and pressing the device's button again SHALL return the bottom row to the tracks.

#### Scenario: Opening the banks
- **WHEN** a person presses the upper display button over the selected device
- **THEN** the bottom row lists the device's banks and the first is marked

#### Scenario: Another bank
- **WHEN** the banks are shown and a person presses the lower display button under Filter
- **THEN** the eight columns show the Filter bank's parameters

### Requirement: Any device can be shown

A device the Set describes only by its parameters SHALL be shown in banks of eight in the order given, and a device with a described layout SHALL be shown with its named banks, spans and drawings.

#### Scenario: An unknown device with twenty parameters
- **WHEN** a device gives twenty parameters and no layout
- **THEN** Device View shows them in three banks of eight, eight and four

### Requirement: A device can show a drawing of what it does

A bank SHALL be able to include a drawing fed by the device's readings: a waveform with its markers, an envelope, a filter curve, an oscillator shape, a spectrum, a gain-reduction meter or a tuner, drawn in the track's colour and updated as the readings change.

#### Scenario: A tuner
- **WHEN** the Tuner device reports a note 10 cents flat
- **THEN** the display shows the note's name and a mark to the flat side of centre

#### Scenario: An envelope follows its parameters
- **WHEN** the app gives a longer attack for a device with an envelope drawing
- **THEN** the envelope's first segment is drawn longer

### Requirement: Devices are deleted, muted and moved from the top row

Holding Delete and pressing a device's upper display button SHALL ask to delete it; holding Mute and pressing it SHALL ask to switch it off or on; and holding an effect's button while turning any encoder SHALL ask to move it along the chain, shown as it moves.

#### Scenario: Muting an effect
- **WHEN** a person holds Mute and presses the upper display button over a delay
- **THEN** the app is asked to switch the delay off, and its parameters are grey once the app does

#### Scenario: Moving an effect
- **WHEN** a person holds the button over the second of three effects and turns an encoder clockwise one step
- **THEN** the app is asked to move that effect one place later in the chain

### Requirement: Racks have their own icons

A Rack in the top row SHALL carry an icon for its kind (Instrument, Drum, Audio Effect, MIDI Effect) so it is told apart from a single device.

#### Scenario: A Drum Rack
- **WHEN** the track's first device is a Drum Rack
- **THEN** its name in the top row carries the Drum Rack icon

### Requirement: A Rack unfolds to show its devices

Pressing an Instrument or Effect Rack's upper display button SHALL unfold it, showing the devices of its selected chain after it in the top row, with an underline from the Rack to the last enclosed device; pressing it again SHALL fold it.

#### Scenario: Unfolding
- **WHEN** a person presses the button over a folded Instrument Rack holding a synthesizer and a chorus
- **THEN** the top row shows the Rack, the synthesizer and the chorus, underlined together

### Requirement: A Rack's chains are reached by holding its button

Holding the upper display button of a Rack with several chains SHALL list its chains in the bottom row, and pressing a chain's lower display button SHALL select it and show its devices.

#### Scenario: The second chain
- **WHEN** a person holds a Rack's button and presses the lower display button under its second chain
- **THEN** the second chain is selected and its devices are shown in the top row

### Requirement: A Drum Rack unfolds to its pads

Pressing a Drum Rack's lower display button SHALL unfold it so the bottom row lists its pads, a pad's lower display button SHALL select it and show its devices and parameters, and the D-pad's left and right arrows SHALL move to the previous or next pad.

#### Scenario: Editing the snare
- **WHEN** a Drum Rack is unfolded and a person presses the lower display button under Snare
- **THEN** the snare pad's device is shown with its parameters under the encoders

### Requirement: Tapping a drum pad shows that pad's devices

In Device View on a Drum Rack track, pressing a pad on the grid SHALL select that pad's chain, marked in the top row with a pad icon, and its device's upper display button SHALL switch between its parameters and its choke group and transpose settings.

#### Scenario: Choke group
- **WHEN** a drum pad's device is selected and a person presses its upper display button to reach the pad settings and turns the first encoder
- **THEN** the app is asked to change that pad's choke group

### Requirement: Devices are grouped into a Rack and ungrouped

Holding Shift and pressing the upper display buttons of several devices SHALL mark them and offer Group, which asks to place them in a Rack; holding Shift and pressing a Rack's button SHALL offer Ungroup, which asks to remove the Rack and keep its devices.

#### Scenario: Grouping two effects
- **WHEN** a person holds Shift, presses the buttons over two effects and presses the display button at Group
- **THEN** the app is asked to group those two devices into a Rack

### Requirement: A Rack's macros are a parameter bank

A Rack SHALL show its macros as its parameters, eight to a bank and up to sixteen in two banks, with one circle before the Rack's name for the first bank and two for the second, and pressing the Rack's display button SHALL switch banks.

#### Scenario: The second eight
- **WHEN** a Rack has twelve mapped macros and its second bank is chosen
- **THEN** macros 9 to 12 are shown and two circles stand before the Rack's name

### Requirement: A parameter is mapped to a macro by touch

Touching a parameter's encoder SHALL offer Map; pressing it SHALL enter Macro Map mode, showing the Rack's macros in pages of eight, where touching a macro's encoder SHALL ask to map the parameter to that macro and Done SHALL leave; and a switch SHALL offer Map when its upper display button is held.

#### Scenario: Mapping a cutoff
- **WHEN** a person touches the encoder over a filter's frequency, presses Map and touches the third encoder
- **THEN** the app is asked to map that parameter to macro 3

#### Scenario: A second parameter on one macro
- **WHEN** macro 3 already has a mapping and a person maps another parameter to it
- **THEN** the app is asked to add the mapping, and the macro reads its default name once it holds two

### Requirement: A macro's assignment is edited and removed

Touching a mapped macro's encoder SHALL offer Edit and Unmap; Edit SHALL show the macro's mappings with an encoder to step between macros, its value, its Min and Max, Rename and Delete Map, and Done to leave; Unmap SHALL ask to remove the assignment.

#### Scenario: Narrowing a range
- **WHEN** a macro's edit options are shown and a person turns the Max encoder down
- **THEN** the app is asked to lower that macro's maximum

#### Scenario: Unmapping
- **WHEN** a person touches a mapped macro's encoder and presses the display button at Unmap
- **THEN** the app is asked to remove that macro's assignment

### Requirement: Macros are randomized and kept as variations

In a Rack's bank the jog wheel SHALL reach a list holding Randomize Macros, Add Variation and the stored variations; pressing on Randomize SHALL ask for new values for all mapped macros, pressing on Add Variation SHALL ask to store the current values, pressing a variation SHALL ask to recall it, and nudging right on one SHALL offer rename, delete and overwrite.

#### Scenario: Recalling a variation
- **WHEN** a person turns the jog wheel to the second variation and presses it
- **THEN** the app is asked to recall that variation

#### Scenario: Overwriting
- **WHEN** a variation is highlighted and a person nudges the jog wheel right and chooses overwrite
- **THEN** the app is asked to store the current macro values in that variation

### Requirement: A device or Rack is saved as a preset

Holding Save and pressing a device's or Rack's upper display button SHALL ask to save it as a preset in the User Library.

#### Scenario: Saving a Rack
- **WHEN** a person holds Save and presses the button over a Rack
- **THEN** the app is asked to save that Rack as a preset and the Set itself is not saved

### Requirement: Automation is marked on its parameter

A parameter with automation in the playing clip SHALL carry a white dot beside its value, grey when the automation is overridden.

#### Scenario: Overridden
- **WHEN** a person turns the encoder of an automated parameter
- **THEN** the dot beside it is grey once the app reports the automation overridden

### Requirement: Delete and an encoder clear automation or reset

Holding Delete and touching an encoder SHALL ask to delete that parameter's automation when it has any, and otherwise to reset the parameter to its default.

#### Scenario: Resetting
- **WHEN** a parameter has no automation and a person holds Delete and touches its encoder
- **THEN** the app is asked to reset that parameter to its default value

### Requirement: An empty track invites a device

Device View on a track with no devices SHALL say so and point to the Add button.

#### Scenario: A new MIDI track
- **WHEN** Device View is opened on a track with no devices
- **THEN** the display says there are no devices and how to add one

### Requirement: The bottom row selects tracks in Device View

When no bank list or chain list is open, the lower display buttons SHALL select the track above them, and the D-pad's left and right arrows SHALL select the previous or next track, scrolling the row when it is out of view.

#### Scenario: Another track
- **WHEN** a person presses lower display button 6
- **THEN** the app is asked to select the sixth track in view and Device View shows its devices once it is selected
