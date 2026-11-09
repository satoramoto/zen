# physics-dsky Spec Delta

## Purpose

The display and keyboard the crew read and keyed during descent.

## ADDED Requirements

### Requirement: The DSKY shows what the crew saw

The DSKY SHALL show the current program, verb and noun, and the three five-digit registers with the values the descent programs display for that noun, in the units and scaling Luminary 099 defines, with its status and caution lamps.

#### Scenario: Braking displays its noun
- **WHEN** P63 is running and displaying its monitor noun
- **THEN** the PROG, VERB and NOUN windows show those numbers and the registers show the noun’s quantities in the source’s units

#### Scenario: A program alarm lights the lamp
- **WHEN** a 1202 is raised
- **THEN** the PROG lamp lights and the alarm code can be displayed

### Requirement: The crew’s keys work during descent

The DSKY SHALL accept the keys that matter during descent: KEY REL to take back the display after an alarm, PRO to proceed, and verb and noun entry for the displays the source offers.

#### Scenario: KEY REL after an alarm
- **GIVEN** a 1202 has been raised and the crew has called up its code with V05N09
- **WHEN** the crew presses KEY REL after a 1202
- **THEN** the alarm display gives way and the monitor noun returns
