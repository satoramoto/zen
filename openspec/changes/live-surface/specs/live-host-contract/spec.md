## ADDED Requirements

### Requirement: A pane draws what the host says

A pane SHALL draw only the readings its host gives it (what is playing, queued, muted, selected or measured), and SHALL show a reading the host doesn't give as missing rather than as a made-up value.

#### Scenario: A press without a host change
- **WHEN** a person launches a clip and the host doesn't queue it
- **THEN** the clip still reads as it did before the press

#### Scenario: The host confirms
- **WHEN** a person launches a clip and the host queues it
- **THEN** the clip reads queued

#### Scenario: A measurement the host doesn't give
- **WHEN** the host gives no DSP load
- **THEN** the pane shows the load as missing, not as zero

### Requirement: A pane asks with one intent per gesture

A pane SHALL turn each gesture into one named intent with one plain-data argument (an id, a reference such as a track and cell, or a 0–1 value), aimed at the target its region is bound to, and SHALL send nothing more once its region is removed mid-gesture.

#### Scenario: A bound region asks for its target
- **WHEN** a region fixed to the second track is pressed
- **THEN** its intent names the second track whatever track is selected

#### Scenario: Following the selection
- **WHEN** a region bound to the selected track is pressed after the selection changes
- **THEN** its intent names the newly selected track

#### Scenario: A drag cut off by removal
- **WHEN** a region is removed while a fader in it is being dragged
- **THEN** no further intent arrives from that drag

### Requirement: Fast values are read by the parts that draw them

The host SHALL be able to give a pane a frame reader for values that change every frame (meters, playheads, beat), and only the leaf parts that draw those values SHALL read it, each animation frame, without the rest of the pane drawing again.

#### Scenario: Meters move on the frame
- **WHEN** the host's frame reader reports new levels on each frame
- **THEN** the meters follow them while the pane's other parts are not redrawn

#### Scenario: No frame reader
- **WHEN** a pane is given no frame reader
- **THEN** its meters and playheads show as missing and nothing else in the pane changes

#### Scenario: Reduced motion
- **WHEN** the person prefers reduced motion
- **THEN** frame-driven parts update without animated transitions and still show the host's current values
