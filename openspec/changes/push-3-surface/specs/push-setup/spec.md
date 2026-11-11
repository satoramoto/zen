# Spec Delta

## Purpose

The unit's own settings and states: the Setup menu's eight tabs, power and battery, Wi-Fi, hotspot and Link, authorization, Cloud and pairing dialogs, software updates, Learn and User Mode.

## ADDED Requirements

### Requirement: Setup opens a menu of eight tabs

Pressing Setup SHALL show the Setup menu with eight tabs on the lower display buttons (Status, Expression, Sensitivity, Audio, MIDI, Pedals & CV, Preferences, Software), opening on Status, and pressing Setup again SHALL return to the screen before.

#### Scenario: Opening
- **WHEN** a person presses Setup
- **THEN** the display shows the Status tab with the eight tab names along the bottom

### Requirement: Every setting is read from the app and asked of it

Each Setup value SHALL be drawn from the unit's readings in the Set, and each change a person makes SHALL be an intent the app answers, so the menu holds no setting of its own.

#### Scenario: A change the app keeps
- **WHEN** a person turns the Display Light encoder down and the app gives 60 percent
- **THEN** the display reads 60 % and is drawn dimmer

### Requirement: Status shows the unit's mode and health

The Status tab SHALL show whether the unit is in Standalone or Control Mode with a display button to switch, the battery's level and whether it is charging, the free storage, the unit's name, and Display Light and LED Brightness under encoders.

#### Scenario: Switching to Control Mode
- **WHEN** the unit is standalone and a person presses the display button at Control Live
- **THEN** the app is asked to switch to Control Mode

#### Scenario: Charging
- **WHEN** the app reports the battery at 38 percent and charging
- **THEN** the Status tab reads 38% with the charging battery mark

#### Scenario: A unit without a processor
- **WHEN** the Set says the unit has no processor
- **THEN** the Status tab shows no battery, no storage and no Standalone choice

### Requirement: Status manages Wi-Fi

The Status tab SHALL have a Wi-Fi switch; when on it SHALL list the networks the app reports, chosen with an encoder, with Connect on a display button that opens text entry for a password; the connected network SHALL be marked green; and with Shift held Connect SHALL read Forget.

#### Scenario: Connecting
- **WHEN** a person selects a network, presses Connect, types a password and presses Done
- **THEN** the app is asked to connect to that network with that password

#### Scenario: Forgetting
- **WHEN** a person holds Shift and presses the display button that now reads Forget
- **THEN** the app is asked to forget the connected network

#### Scenario: Wi-Fi off
- **WHEN** Wi-Fi is off
- **THEN** no networks are listed

### Requirement: Status manages the hotspot and Link

The Status tab SHALL have a Hotspot switch that, when on, shows the network name and password the app gives; a Link switch on the last encoder; and a Play Sync switch on a display button.

#### Scenario: Hotspot on
- **WHEN** the app reports the hotspot on with a name and a password
- **THEN** both are shown on the Status tab

#### Scenario: Link
- **WHEN** a person turns the last encoder to On
- **THEN** the app is asked to switch Link on

### Requirement: Expression sets how the pads bend and press

The Expression tab SHALL set the Expression Mode (MPE, Poly Aftertouch, Mono Aftertouch) and, in MPE, Note Pitch Bend (automatic, On, Off), In Tune Location (Finger, Pad), In Tune Width (0 to 20 mm) and Slide Height (10 to 16 mm).

#### Scenario: Poly Aftertouch hides the MPE options
- **WHEN** the Expression Mode is Poly Aftertouch
- **THEN** the pitch bend and slide settings are not offered

#### Scenario: A wider in-tune zone
- **WHEN** a person turns In Tune Width to 15 mm
- **THEN** the app is asked to set the in-tune width to 15 mm

### Requirement: Sensitivity sets the velocity curve

The Sensitivity tab SHALL set Threshold, Drive, Compand and Range under encoders, draw the resulting velocity curve, mark on it the force of each pad press as it happens, and offer Reset on a display button.

#### Scenario: Reset
- **WHEN** a person presses the display button at Reset
- **THEN** the app is asked to return the four settings to their defaults

#### Scenario: Seeing a press
- **WHEN** the Sensitivity tab is shown and a person presses a pad
- **THEN** a mark shows where that press fell on the curve

### Requirement: Audio sets the interface

The Audio tab SHALL set the sample rate (44,100 to 96,000 Hz), the buffer size (128 to 2048 samples), each input's preamp type (Line, Instrument, High) and digital gain up to 20 dB with a level meter beside it, Link 1 & 2 for stereo, the output routing and the clock source (Internal, ADAT In).

#### Scenario: An instrument input
- **WHEN** a person turns input 1's encoder to Instrument
- **THEN** the app is asked to set input 1's preamp to Instrument

#### Scenario: Linked inputs
- **WHEN** Link 1 & 2 is on and a person changes input 1's preamp type
- **THEN** the app is asked to set both inputs to that type

#### Scenario: An input meter
- **WHEN** the app reports a signal on input 2
- **THEN** the meter beside input 2 shows its level

### Requirement: MIDI sets each port

The MIDI tab SHALL list the ports the app reports (the MIDI In and Out jacks and each USB device), switch between a port's Input and Output with an encoder, and offer Track, Sync, Remote and (for inputs) MPE as switches, with External Sync and Sync Delay available when an input's Sync is on.

#### Scenario: Clock out
- **WHEN** a person selects a port's Output and presses the display button at Sync
- **THEN** the app is asked to send MIDI clock to that port

#### Scenario: External Sync
- **WHEN** no input has Sync on
- **THEN** External Sync is greyed

### Requirement: Pedals & CV sets each jack

The Pedals & CV tab SHALL set each of the two jacks to a footswitch or to CV Out with an encoder, CV Out off by default, and SHALL name the outputs each jack carries (5 and 6, 7 and 8).

#### Scenario: Enabling CV
- **WHEN** a person turns the Pedal 1 encoder to CV Out
- **THEN** the app is asked to set Pedal 1 to CV output, and the tab names outputs 5 and 6

### Requirement: Preferences sets workflow and track behaviour

The Preferences tab SHALL set Workflow (Scene, Clip), Exclusive Arm, Exclusive Solo and Select on Launch under encoders.

#### Scenario: Clip Workflow
- **WHEN** a person turns the Workflow encoder to Clip
- **THEN** the app is asked to set the workflow to Clip

### Requirement: Software shows the licence and updates

The Software tab SHALL show the software version, the authorized licence and account, Authorize on a display button, a Send Usage Data switch (absent when the app says the build is a beta) and, when the app reports an update, Update on a display button and an asterisk on the tab.

#### Scenario: An update is ready
- **WHEN** the app reports a new version
- **THEN** the tab reads Software* and offers Update

#### Scenario: Updating
- **WHEN** an update is installing at 40 percent
- **THEN** a progress bar is shown at 40 percent with a display button to cancel

### Requirement: Shift shows the advanced software options

On the Software tab, holding Shift SHALL show Legal Info, Crash Info and Reset Push on display buttons; the first two SHALL open a dialog with their address, and Reset Push SHALL ask for confirmation before the app is asked.

#### Scenario: Reset needs a yes
- **WHEN** a person holds Shift and presses the display button at Reset Push
- **THEN** a confirmation is shown and nothing is asked until it is accepted

### Requirement: Authorization, Cloud and pairing use a code

When the app says an authorization, a Cloud activation, a crash-report download or a pairing with Live has begun, the display SHALL show the dialog with the address to visit (where there is one) and the six-digit code, until the app says it is done or the person cancels.

#### Scenario: Authorizing
- **WHEN** a person presses Authorize and the app gives a code
- **THEN** the display shows the address push.local/authorize and the six digits

#### Scenario: Cancelling a pairing
- **WHEN** a pairing code is shown and a person presses the display button at Cancel
- **THEN** the app is asked to cancel the pairing and the dialog closes

### Requirement: The battery is shown and its end is safe

The display SHALL show the battery mark over any screen below 7 percent, and when the app reports the unit shutting down it SHALL show that the Set is being saved and then go dark.

#### Scenario: Running out
- **WHEN** the app reports the battery empty and a shutdown under way
- **THEN** the display says the Set is being saved, and every lamp and the display go dark when the app reports the unit off

### Requirement: Power on shows starting up

When the app reports the unit starting, the display SHALL show a start-up screen until the app gives a Set, and on a first start SHALL be able to show the onboarding steps the app gives.

#### Scenario: Booting
- **WHEN** the app reports the unit starting and no Set yet
- **THEN** the display shows the start-up screen and the lamps are unlit

### Requirement: Learn lists lessons

Pressing Learn SHALL show the lessons the app lists, opened with the jog wheel and paged with display buttons, and a code image linking to further material when the app gives one.

#### Scenario: A lesson
- **WHEN** a person presses Learn and chooses the first lesson
- **THEN** the lesson's first page is shown with a way to go to the next

### Requirement: User enters and leaves User Mode

Pressing User in Control Mode, or in Standalone Mode with a Set that holds mappings, SHALL enter User Mode, where the display shows only that User Mode is active, and pressing it again SHALL leave; where User Mode is not available the button SHALL be unlit.

#### Scenario: Entering
- **WHEN** the unit is in Control Mode and a person presses User
- **THEN** the User button is lit and the display shows that User Mode is active

### Requirement: The volume choices follow the unit

The Volume encoder SHALL cycle only through the volumes the Set offers (main output, headphones, Main track, Cue), and the metronome's level SHALL be the Cue volume.

#### Scenario: Cue volume
- **WHEN** a person presses the Volume encoder until Cue is chosen and turns it down
- **THEN** the app is asked to lower the Cue volume
