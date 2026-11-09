# physics-lunar-descent Specification

## Purpose

The Lunar Module’s powered descent from the start of braking to touchdown, as Luminary 099 guided it, including its program switches and the 1202 overload.

## Requirements

### Requirement: The descent is guided as Luminary 099 guided it

The simulator SHALL steer the Lunar Module from the start of braking to touchdown with the descent guidance equations of Luminary 099, and every constant and target it uses SHALL either cite the source file and line it comes from or be listed in `SOURCES.md` as an approximation with its reason.

#### Scenario: A nominal descent lands
- **WHEN** the descent runs from the start of braking with no crew input
- **THEN** the Lunar Module touches down upright, within the landing velocity limits the source sets, with propellant left

#### Scenario: Every number has a source
- **WHEN** a reader opens `SOURCES.md`
- **THEN** each guidance constant and target is listed with the Luminary 099 file and line it comes from, or marked as an approximation with its reason

### Requirement: The programs switch as they did

The descent SHALL run P63 (braking) until its switching criterion is met, then P64 (approach), and SHALL enter P66 (rate of descent) when the crew selects it, with the switching criteria taken from the source.

#### Scenario: Braking gives way to approach
- **WHEN** the braking phase meets the source’s criterion for high gate
- **THEN** the program becomes P64 and the Lunar Module pitches over so the landing site comes into view

#### Scenario: The crew takes over the rate of descent
- **WHEN** the crew selects P66 during approach
- **THEN** the program becomes P66 and each click of the rate switch changes the commanded descent rate by the step the source defines

### Requirement: A 1202 comes from overload

The simulator SHALL model the guidance computer’s executive: when more work is scheduled than it can run in a cycle, it SHALL raise a 1202 alarm and restart, shedding the lowest-priority work, while guidance carries on.

#### Scenario: Extra load raises a 1202
- **GIVEN** the rendezvous radar is stealing time, as its switch let it on Apollo 11
- **WHEN** a load like the rendezvous radar’s is added during descent until the executive overflows
- **THEN** the DSKY shows a 1202 and the program alarm, and guidance continues after the restart

#### Scenario: The descent survives the alarm
- **WHEN** 1202 alarms occur during braking as they did on Apollo 11
- **THEN** the descent still lands, and the alarms are listed in the flight log with their mission time
