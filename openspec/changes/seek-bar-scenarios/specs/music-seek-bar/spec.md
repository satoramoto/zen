# music-seek-bar Spec Delta

## Purpose

A controlled slider over a track: the host holds the position, the bar reports where the listener wants to go.

## ADDED Requirements

### Requirement: Seeking by pointer and keyboard

The seek bar SHALL report every pointer press, drag and Home, End or arrow key as an onSeek call in seconds, SHALL show the dragged position while a press lasts and the host's position once it ends, and SHALL clamp what it shows to the duration.

#### Scenario: Press seeks
- **WHEN** the pointer presses the slider at its middle
- **THEN** onSeek is called with 60 and the slider reads 60 while the press lasts

#### Scenario: Drag follows
- **GIVEN** a press at the middle
- **WHEN** the pointer drags to the right edge
- **THEN** onSeek's last call is 120, where the drag is

#### Scenario: Release shows the host
- **GIVEN** a drag from the middle to the right edge
- **WHEN** the pointer releases
- **THEN** the slider shows the host's position, 20, not where the drag ended

#### Scenario: Keys seek
- **WHEN** Home, ArrowLeft, End and ArrowRight are pressed in turn
- **THEN** onSeek is called with 0, 0, 120 and 120

#### Scenario: Escape cancels
- **GIVEN** a press at the left edge, which seeks to 0
- **WHEN** the pointer moves to the right edge and Escape is pressed
- **THEN** no further onSeek call is made and the slider shows 20 again

#### Scenario: Pointer cancel restores
- **GIVEN** a press at the left edge
- **WHEN** the browser sends pointercancel instead of pointerup
- **THEN** the slider shows 20 again

#### Scenario: Lost capture restores
- **GIVEN** a press at the left edge
- **WHEN** the browser sends lostpointercapture instead of pointerup
- **THEN** the slider shows 20 again

#### Scenario: Out of range
- **GIVEN** a host position of 999 on a 120-second track
- **WHEN** the slider is drawn
- **THEN** it reads the duration, 120

#### Scenario: Host update waits
- **GIVEN** a press at the middle, so the slider reads 60
- **WHEN** the host moves its position to 35 during the press
- **THEN** the slider keeps the press's 60

#### Scenario: Host update shows on release
- **GIVEN** a press at the middle during which the host moved its position to 35
- **WHEN** the pointer releases
- **THEN** the slider shows the host's 35

### Requirement: Inert states

The seek bar SHALL be inert, marked aria-disabled and never calling onSeek, when it is disabled, when the duration is zero, and when the duration or position is not finite.

#### Scenario: Disabled
- **GIVEN** a disabled seek bar
- **WHEN** the slider is pressed and End is pressed
- **THEN** onSeek is not called
- **AND** the slider is aria-disabled

#### Scenario: Zero duration
- **GIVEN** a track of zero duration
- **WHEN** the slider is pressed and End is pressed
- **THEN** onSeek is not called
- **AND** the slider is aria-disabled

#### Scenario: Invalid duration
- **GIVEN** a duration of NaN and a position of Infinity
- **WHEN** the slider is pressed and End is pressed
- **THEN** onSeek is not called
- **AND** the slider is aria-disabled
