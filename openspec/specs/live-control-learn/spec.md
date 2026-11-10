# live-control-learn Specification

## Purpose

Learn mode on a control: asking the app to learn a control’s parameter from whatever it listens to (a MIDI controller, OSC, a key), the control the app waits on, and showing and forgetting mappings in the app’s words.

## Requirements

### Requirement: Learn mode asks to learn a control’s parameter

While the app says learn mode is on, pressing a control SHALL ask to learn its parameter instead of moving it, and the control the app is waiting on SHALL be marked until the app maps it or learn mode ends.

#### Scenario: Learning a fader
- **WHEN** learn mode is on and a person presses the delay send fader
- **THEN** one learn intent naming the delay send is sent, no parameter intent is sent, and the fader shows it is waiting once the app says so

#### Scenario: The app maps it
- **WHEN** the app stops waiting and gives the delay send a mapping
- **THEN** the fader stops showing it is waiting and shows its mapping

#### Scenario: Learn mode off
- **WHEN** learn mode is off
- **THEN** pressing a control moves it as usual and asks to learn nothing

### Requirement: Mappings are shown and can be forgotten

A control whose parameter the app has mapped SHALL show the mapping in the app’s words, in learn mode and out of it, and in learn mode SHALL offer to forget it.

#### Scenario: A mapped control on stage
- **WHEN** the filter is mapped to `CC 21 · ch 1` and learn mode is off
- **THEN** the fader shows a small `CC 21` mark and plays as usual

#### Scenario: Forgetting a mapping
- **WHEN** learn mode is on and a person forgets the filter’s mapping
- **THEN** one forget intent naming the filter is sent

#### Scenario: A hardware move
- **WHEN** the app moves the filter’s value because a controller moved
- **THEN** the fader follows it like any other reading
