# Spec Delta

## Purpose

Session View on the device: clips and scenes on the display (Session Screen Mode), on the pads (Session Pad Mode) and in overview, with launching, stopping, copying, deleting and the Scene and Clip workflows.

## ADDED Requirements

### Requirement: Session Screen Mode shows clips on the display

Pressing the Session button above the jog wheel SHALL show the Set's clips on the display as a grid of eight tracks by eight scenes, each clip a block in its colour with its name, the scene numbers down the right side, the selected clip slot outlined, and playing and stopped slots marked.

#### Scenario: A named clip
- **WHEN** Session Screen Mode shows a track with a clip named Distant Kicks
- **THEN** the clip is a block of its colour reading its name, in its track's column and its scene's row

#### Scenario: The playing scene
- **WHEN** scene 2 is playing
- **THEN** its number at the right carries the play mark

### Requirement: Session Screen Mode is navigated with the jog wheel and D-pad

In Session Screen Mode, turning the jog wheel or pressing the D-pad's up and down arrows SHALL move the selection through scenes, and nudging the jog wheel or pressing the left and right arrows SHALL move it through tracks, scrolling the grid to keep it in view.

#### Scenario: Down a scene
- **WHEN** scene 2 is selected and a person turns the jog wheel one detent clockwise
- **THEN** scene 3 is selected

#### Scenario: Past the eighth track
- **WHEN** the eighth visible track is selected and a person presses the right arrow
- **THEN** the ninth track is selected and the grid has scrolled to show it

### Requirement: The upper display buttons launch clips in the selected scene

In Session Screen Mode each upper display button SHALL ask to launch the clip of its track in the selected scene, SHALL be lit in the clip's colour, pulsing green while that clip is queued, and red for an empty slot on an armed track.

#### Scenario: Launching one clip
- **WHEN** scene 2 is selected and a person presses upper display button 3
- **THEN** the app is asked to launch track 3's clip in scene 2

#### Scenario: An empty slot on an armed track
- **WHEN** the selected scene's slot on an armed track is empty
- **THEN** that track's upper display button is red

### Requirement: The jog wheel shows scene names

In Session Screen Mode, touching the jog wheel SHALL show the scenes' names in place of their numbers while it is touched.

#### Scenario: Named scenes
- **WHEN** a person touches the jog wheel and scene 2 is named Chorus
- **THEN** the display shows Chorus beside scene 2 until the wheel is released

### Requirement: Clips are copied and deleted from the screen

In Session Screen Mode, holding Delete and pressing a track's upper display button SHALL ask to delete the selected scene's clip on that track; holding Duplicate and pressing one SHALL copy that clip, and pressing another track's button after moving the selection, still holding Duplicate, SHALL ask to paste it there.

#### Scenario: Deleting a clip
- **WHEN** a person holds Delete and presses upper display button 4
- **THEN** the app is asked to delete track 4's clip in the selected scene

### Requirement: Session Pad Mode puts clips on the pads

Pressing the Session button below the D-pad SHALL show an 8 by 8 window of the Set on the pads, each column a track and each row a scene, a pad lit in its clip's colour, unlit for an empty slot, blinking green when queued, pulsing green when playing and red when recording or when it is an empty slot of an armed track.

#### Scenario: A queued clip
- **WHEN** a clip has been asked to launch and waits for the launch quantization
- **THEN** its pad blinks green

#### Scenario: An armed track's empty slots
- **WHEN** an audio track is armed
- **THEN** its empty slots' pads are red

### Requirement: A pad launches, records or stops

In Session Pad Mode, pressing a pad with a clip SHALL ask to launch it; pressing an empty pad on a track that is not armed SHALL ask to stop that track's clip; and pressing an empty pad on an armed track SHALL ask to record into that slot.

#### Scenario: Stopping a track
- **WHEN** a person presses an empty pad in a column whose track is playing a clip and is not armed
- **THEN** the app is asked to stop that track's clip

#### Scenario: Recording a new clip
- **WHEN** a person presses an empty pad on an armed track
- **THEN** the app is asked to record into that slot

### Requirement: Scenes are launched from three places

In Session Pad Mode each scene button SHALL ask to launch its row's scene, and the D-pad's centre and the jog wheel's press SHALL ask to launch the selected scene.

#### Scenario: A scene button
- **WHEN** a person presses the third scene button
- **THEN** the app is asked to launch the scene in the pads' third row

### Requirement: The pad window is moved without changing the selection

In Session Pad Mode the D-pad's arrows SHALL move the window by one track or scene, Page Left and Right by eight tracks and Octave Up and Down by eight scenes, and moving the window SHALL NOT change which clip is selected.

#### Scenario: A page of tracks
- **WHEN** tracks 1 to 8 are on the pads and a person presses Page Right
- **THEN** tracks 9 to 16 are on the pads and the selected clip is the same

### Requirement: The display and the pads show the same part of the Set

Session Screen Mode and Session Pad Mode SHALL show the same tracks and scenes, and in Control Mode the device SHALL report the window it shows so the app can draw the Session Ring.

#### Scenario: One window
- **WHEN** a person scrolls to scene 9 in Session Screen Mode and opens Session Pad Mode
- **THEN** the pads' window includes scene 9

### Requirement: Select picks a clip without launching it

In Session Pad Mode, holding Select and pressing a pad SHALL select that clip, show its name on the display and ask for no launch.

#### Scenario: Looking at a clip
- **WHEN** a person holds Select and presses a pad with a clip
- **THEN** the clip is selected, its name is shown and it is not launched

### Requirement: Clips are copied and deleted on the pads

In Session Pad Mode, holding Duplicate, pressing a pad with a clip and then another pad SHALL ask to copy the clip there; holding Delete and pressing a pad SHALL ask to delete its clip.

#### Scenario: Copying to an empty slot
- **WHEN** a person holds Duplicate, presses a clip's pad and then an empty pad
- **THEN** the app is asked to copy the clip to the empty slot

### Requirement: A clip's colour is chosen from the grid

In Session Pad Mode, holding Shift and pressing a pad with a clip SHALL show the colours on the grid's outer ring, and tapping one SHALL ask to give the clip that colour.

#### Scenario: A yellow clip
- **WHEN** a person holds Shift, presses a clip's pad and taps the yellow pad on the outer ring
- **THEN** the app is asked to colour that clip yellow

### Requirement: Session Overview shows the whole Set

In Session Pad Mode, holding Layout SHALL show the overview while held, each pad standing for a block of eight tracks by eight scenes: white for the block in view, green for a block with playing clips, unlit where there are no tracks or scenes; pressing a pad SHALL move the window to its block; and Shift with Layout SHALL lock the overview.

#### Scenario: Jumping to a block
- **WHEN** the overview is shown and a person presses the pad in the third row, first column
- **THEN** the window shows scenes 17 to 24 and tracks 1 to 8

#### Scenario: Blocks of 64 scenes
- **WHEN** the overview is shown for a Set with more than 64 scenes
- **THEN** each scene button stands for a further block of 64 scenes and pressing one shows it

### Requirement: Stop Clip stops clips

Pressing Stop Clip SHALL ask to stop the selected track's clip; holding it and pressing a track's lower display button SHALL ask to stop that track's clip; and Shift with Stop Clip SHALL ask to stop all clips.

#### Scenario: Stop everything
- **WHEN** a person holds Shift and presses Stop Clip
- **THEN** the app is asked to stop all clips

#### Scenario: Which tracks are stopped
- **WHEN** a person holds Stop Clip
- **THEN** the lower display buttons of tracks with no playing clip are unlit

### Requirement: Scene Workflow acts on scenes

With the Workflow preference set to Scene, Duplicate SHALL ask for a new scene holding all playing clips, New SHALL ask for a new scene holding all playing clips but the selected track's with an empty slot prepared there, the D-pad's centre SHALL ask to launch the selected scene, and Shift with the centre SHALL ask to launch the selected clip.

#### Scenario: New in Scene Workflow
- **WHEN** the Workflow is Scene and a person presses New
- **THEN** the app is asked for a new scene with the other tracks' playing clips and an empty slot on the selected track

### Requirement: Clip Workflow acts on the selected clip

With the Workflow preference set to Clip, Duplicate SHALL ask to copy the selected clip to the next slot, Shift with Duplicate SHALL ask for a new scene of the playing clips, New SHALL ask to prepare an empty slot on the selected track only, the D-pad's centre SHALL ask to launch the selected clip, and Shift with the centre SHALL ask to launch the selected scene.

#### Scenario: New in Clip Workflow
- **WHEN** the Workflow is Clip and a person presses New
- **THEN** the app is asked to prepare an empty slot on the selected track and nothing else

### Requirement: The up and down arrows step scenes from other screens

In Clip View, pressing the D-pad's up or down arrow SHALL show Session Screen Mode for a moment and move the selection one scene, so another clip of the same track can be reached without leaving Clip View; left and right SHALL change track.

#### Scenario: The clip below
- **WHEN** Clip View is shown and a person presses the D-pad's down arrow
- **THEN** the session grid is shown briefly with the next scene selected, and Clip View returns showing that scene's clip
