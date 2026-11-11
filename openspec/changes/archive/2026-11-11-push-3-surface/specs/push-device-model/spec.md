# push-device-model Spec Delta

## Purpose

The plain-data contract between an app and the device: the Set the app gives, the device's own state, the inputs a person makes, the intents the device asks, and the projection of all of it to lamps and a display, with no sound and no MIDI.

## ADDED Requirements

### Requirement: The Set is plain data the app owns

The app SHALL give the device a Set as plain data: its tracks, devices and parameters, clips, scenes and notes, its transport, its browser content, and the unit's own readings (settings, battery, storage, networks, ports); and the device SHALL never change the Set itself.

#### Scenario: The Set survives JSON
- **WHEN** a Set is written as JSON and read back
- **THEN** the device draws the same lamps and display from it

#### Scenario: The device does not edit the Set
- **WHEN** a person turns an encoder over a parameter and the app gives no new Set
- **THEN** the parameter's value on the display is unchanged

### Requirement: The device's own state is plain data the app holds

Everything the device remembers that is not in the Set (the mode, the screen, the pad layout, what is held, what is locked, the highlight in a list, the page of steps in view, the selection of notes) SHALL be one plain-data state that the app holds and passes back.

#### Scenario: State survives JSON
- **WHEN** the device's state is written as JSON mid-session, read back and given to the device with the same Set
- **THEN** the lamps and display are the same as before

#### Scenario: Two devices on one Set
- **WHEN** two device states are projected over the same Set
- **THEN** each shows its own mode and screen

### Requirement: An input returns the next state and the intents

Giving the device an input with the current state and Set SHALL return the next state and a list of intents, as a pure function: the same three always give the same result, and nothing else is read or changed.

#### Scenario: The same input twice
- **WHEN** the same input is applied twice to the same state and Set
- **THEN** both results are identical

#### Scenario: Time comes with the input
- **WHEN** two presses of a display button arrive with times a short moment apart
- **THEN** the device treats them as a double press from the times alone

### Requirement: Lamps and display are a projection

The device SHALL give, from a state and a Set alone, the lamp of every control and the screen description for the display, as a pure function.

#### Scenario: Projection without input
- **WHEN** a state and a Set are projected with no input having been applied
- **THEN** every control's lamp and a full screen description are returned

### Requirement: Intents are plain data in known kinds

Each intent SHALL be plain data that names what is asked and of what, and SHALL be one of a published list of kinds: a note or expression message, an edit to the Set, transport, navigation in the Set, a file action, or a device setting.

#### Scenario: Launching a clip
- **WHEN** a person presses a pad on a clip in Session Pad Mode
- **THEN** one intent asks to launch that clip, naming its track and scene

#### Scenario: An app sorts by kind
- **WHEN** an app receives an intent that sets a parameter and one that selects a track
- **THEN** it can tell the first is an edit and the second is navigation from the intents themselves

### Requirement: The device shows what the app gives, not what it asked

After asking an intent the device SHALL show a change only when the app gives a Set that has it, so an app that refuses or delays an intent is shown truthfully.

#### Scenario: A refused mute
- **WHEN** a person presses Mute and the app returns the same Set
- **THEN** the track is still shown unmuted

### Requirement: A press and a hold of the same button differ

For the buttons the manual gives two jobs (Metronome, Quantize, Fixed Length, Layout, Repeat, Accent, Session, Note), the model SHALL do the press job when the button is released quickly and the hold job while it is held past the hold time.

#### Scenario: A quick press of Quantize
- **WHEN** a person presses and quickly releases Quantize
- **THEN** the app is asked to quantize the selected clip's notes

#### Scenario: Holding Quantize
- **WHEN** a person holds Quantize past the hold time
- **THEN** the quantization options are shown while it is held and nothing is quantized

### Requirement: A hold used as a modifier does not also fire

When a button that acts on press is held and another control is pressed with it (Delete, Duplicate, Mute, Solo, Stop Clip, Record, Save, Quantize), the model SHALL apply the combination and SHALL NOT also apply the button's own press.

#### Scenario: Delete and a pad
- **WHEN** a person holds Delete, presses a drum pad and releases both
- **THEN** the app is asked to delete that pad's notes and is not asked to delete the clip

### Requirement: Shift and Select change what a press means

Shift and Select SHALL do nothing alone; while held, they SHALL give other controls the second function the manual names, and the model SHALL publish every combination it knows as data.

#### Scenario: Shift and Undo
- **WHEN** a person holds Shift and presses Undo
- **THEN** the app is asked to redo

#### Scenario: The combinations are listed
- **WHEN** a developer asks the model for its combinations
- **THEN** each is returned with its controls, the mode it applies in and what it asks

### Requirement: A mode button held is momentary

Holding Note while in Session Pad Mode, or Session while in Note Mode, past the hold time SHALL show the other mode on the pads until the button is released; a quick press SHALL switch for good.

#### Scenario: A momentary visit to Session
- **WHEN** the pads are in Note Mode and a person holds Session, launches a clip and releases Session
- **THEN** the pads return to Note Mode

### Requirement: The display mode and the pad mode are separate

The model SHALL keep what the display shows (Device, Mix, Clip, Session Screen, Browse and the menus) apart from what the pads do (Note Mode with its layout, or Session Pad Mode), so either can change without the other.

#### Scenario: Device View while launching clips
- **WHEN** the pads are in Session Pad Mode and a person presses Device
- **THEN** the display shows Device View and the pads still launch clips

### Requirement: A mode button's lamp shows where the device is

The lamps of the buttons that choose a screen or mode (Device, Mix, Clip, Session Screen, Add, Swap, Main, Sets, Setup, Learn, User, Note, Session) SHALL be lit for the one in effect and dim for the others that can be chosen.

#### Scenario: In Mix
- **WHEN** the display shows Global Mix Mode
- **THEN** the Mix button is lit and Device, Clip and Session Screen are dim

### Requirement: A button with nothing to do is unlit

A button whose action is not available in the current state (Octave Up at the top of the range, Convert with nothing to convert, Page Left on the first page, Swap with nothing selected) SHALL be unlit and a press of it SHALL ask nothing.

#### Scenario: The top octave
- **WHEN** the pads already show the highest octave
- **THEN** Octave Up is unlit and pressing it asks nothing

### Requirement: Control Mode and Standalone Mode differ only where the manual says

The Set SHALL say whether the unit is in Standalone or Control Mode, and the model SHALL differ between them only in the behaviours the manual names: automatic arming, the Sets button's list, saving, Arrangement recording and focus, the Session Ring, and the availability of User Mode.

#### Scenario: Arming in Standalone
- **WHEN** the unit is in Standalone Mode and a person selects an audio track in Note Mode
- **THEN** the track is shown armed without a second press

#### Scenario: Arming in Control Mode
- **WHEN** the unit is in Control Mode and a person selects an audio track
- **THEN** the track is not armed until it is armed by hand

### Requirement: The Set says what is available

The Set SHALL be able to say what the licence and hardware allow (the Live edition, a processor, an ADAT extender, connected MIDI devices), and the model SHALL leave out or grey the options that are not available.

#### Scenario: Live Intro
- **WHEN** the Set says the edition is Intro and a person presses Convert on an audio clip
- **THEN** the Audio to MIDI choices are not offered

### Requirement: User Mode turns the device into bare controls

In User Mode the model SHALL ask nothing of the Set: every button SHALL report a control change, every pad a note, every encoder a relative control change when turned and a note when touched, and the touch strip pitch bend; and the User button SHALL always leave User Mode.

#### Scenario: A button in User Mode
- **WHEN** the device is in User Mode and a person presses Play
- **THEN** a control change is reported for Play and the app is not asked to start playback

#### Scenario: Leaving
- **WHEN** the device is in User Mode and a person presses User
- **THEN** the device returns to the mode and screen it had before

### Requirement: Lamps in User Mode come from the app

In User Mode the lamps SHALL show only what the app sets for each control.

#### Scenario: Feedback
- **WHEN** the device is in User Mode and the app sets pad 1 to red
- **THEN** pad 1 is red and every control the app has not set is unlit

### Requirement: The pedals are inputs

The model SHALL take footswitch presses as inputs: on Pedal 1 a single tap SHALL act as the Record button and a quick double tap as the New button, and Pedal 2 SHALL report sustain down and up.

#### Scenario: A double tap on Pedal 1
- **WHEN** a person taps the Pedal 1 footswitch twice quickly
- **THEN** the app is asked what the New button asks

#### Scenario: Sustain
- **WHEN** a person holds the Pedal 2 footswitch
- **THEN** sustain down is reported, and sustain up on release

### Requirement: The model can be scripted

A developer SHALL be able to run a sequence of inputs through the model and read the intents, lamps and screen descriptions at each step, with no renderer and no browser.

#### Scenario: A scripted session
- **WHEN** a list of inputs is applied in order to a starting state and Set outside a browser
- **THEN** the intents and the screen description after each input are returned as data

### Requirement: An input the model does not know is ignored

An input naming a control the surface does not have, or data the model cannot read, SHALL return the same state and no intents.

#### Scenario: An unknown control
- **WHEN** an input names a control that does not exist
- **THEN** the state is unchanged and no intent is asked
