# live-panel-layout Spec Delta

## Purpose

Building a panel to play: a tab as a split tree with shares, resized by its handles, docked by dragging, locked for the gig, each region in the form its room fits, by touch, mouse and keyboard.

## ADDED Requirements

### Requirement: A tab is a layout tree with shares

A tab SHALL lay its regions out as a tree that splits into rows or columns to any depth, each child taking its share of its parent’s room, with region instances at the leaves.

#### Scenario: A column beside a row of two
- **WHEN** a tab’s layout is a row whose first child is a region and whose second is a column of two regions, with shares 2 and 1
- **THEN** the first region takes two thirds of the width and the two in the column stack in the last third

#### Scenario: Shares, not pixels
- **WHEN** the same tab is drawn in a smaller window
- **THEN** every region keeps its share of the room

### Requirement: Regions are resized by their split handles

In edit mode the surface SHALL put a handle between every two siblings of a split; dragging it or pressing the arrow keys on it SHALL change only those two shares, previewing as it moves and sending one resize intent when it ends, and SHALL never give a region less room than its smallest form.

#### Scenario: Dragging a handle
- **WHEN** a person drags the handle between two regions toward the second and lets go
- **THEN** the first grows and the second shrinks while dragging, and one resize intent with both new shares is sent on release

#### Scenario: Resizing from the keyboard
- **WHEN** a person focuses a handle and presses the right arrow three times
- **THEN** each press sends one resize intent moving the shares one step

#### Scenario: The smallest form is a floor
- **WHEN** a person drags a handle until the region beside it would be smaller than its smallest form
- **THEN** the handle stops where that form still fits

### Requirement: Regions are docked by dragging

In edit mode a person SHALL be able to drag a region by its tag onto another region and drop it on one of five zones (left, right, above, below, swap), and the surface SHALL send one dock intent naming the region, the target and the zone; the step-wise move tools SHALL remain for the keyboard.

#### Scenario: Docking below
- **WHEN** a person drags the grid by its tag onto the lower zone of the stems and drops
- **THEN** the surface sends one dock intent naming the grid, the stems and below, and the applied document stacks the grid under the stems

#### Scenario: Swapping
- **WHEN** a person drops a region on another’s centre zone
- **THEN** the two regions trade places

#### Scenario: A drop outside every region
- **WHEN** a person lets go of a dragged tag outside every region
- **THEN** nothing is sent and the layout is as it was

### Requirement: A locked tab can’t be edited

A tab SHALL carry whether it is locked; a locked tab SHALL show no edit tools, handles or drop zones, and its panes SHALL take every touch, until a person deliberately unlocks it.

#### Scenario: Locking for the gig
- **WHEN** a person locks the panel
- **THEN** the surface sends one lock intent, and once applied the panel shows no edit tools while every pane still plays

#### Scenario: A stray touch on a locked tab
- **WHEN** a person drags across a locked tab
- **THEN** no region moves and no intent but the panes’ own is sent

#### Scenario: Unlocking takes intent
- **WHEN** a person presses unlock briefly
- **THEN** the tab stays locked until the press is held

### Requirement: A region draws the largest form its room fits

The surface SHALL give each region the room its share works out to and draw the largest of its pane’s forms that fits that room, so a resized region steps its form up or down.

#### Scenario: Growing a region steps its form up
- **WHEN** the mix is resized from a short share to a tall one
- **THEN** it changes from its short form to its tall form

### Requirement: Edit mode works by touch, mouse and keyboard

Every edit tool SHALL be reachable and usable with a finger (targets at least the principles’ minimum target, nothing that only appears on hover), with a mouse, and with the keyboard alone.

#### Scenario: The keyboard alone
- **WHEN** a person builds a two-pane tab using only the keyboard
- **THEN** every step (open the palette, add, open a region’s tools, move, resize, lock) is possible and each sends its intent

#### Scenario: Finger-sized tools
- **WHEN** edit mode is drawn
- **THEN** every handle, tag and tool is at least the minimum target in both directions
