# live-panel-layout Spec Delta

## MODIFIED Requirements

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

#### Scenario: A locked tab opened while editing
- **WHEN** the surface is editing one tab and a person opens another that is locked
- **THEN** the locked tab shows no frames, handles, palette or tab tools (it can’t be renamed, duplicated or removed), only the hold to unlock
- **AND** going back to the first tab finds it still in edit mode

### Requirement: A region draws the largest form its room fits

The surface SHALL give each region the room its share works out to and draw the largest of its pane’s forms that fits that room, so a resized region steps its form up or down; a region with less room than its smallest form SHALL draw that smallest form and be marked as cramped, and nothing reflows.

#### Scenario: Growing a region steps its form up
- **WHEN** the mix is resized from a short share to a tall one
- **THEN** it changes from its short form to its tall form

#### Scenario: Less room than the smallest form
- **WHEN** a document gives a region a share too small for even its smallest form
- **THEN** the region draws its smallest form and is marked as cramped, and the region beside it keeps its own share
