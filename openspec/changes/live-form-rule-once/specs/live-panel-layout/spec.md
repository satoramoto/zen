# live-panel-layout Spec Delta

## MODIFIED Requirements

### Requirement: A region draws the largest form its room fits

The surface SHALL give each region the room its share works out to and draw the largest of its pane’s forms that fits that room, so a resized region steps its form up or down; a region with less room than its smallest form SHALL draw that smallest form and be marked as cramped, and nothing reflows.

#### Scenario: Growing a region steps its form up
- **WHEN** the mix is resized from a short share to a tall one
- **THEN** it changes from its short form to its tall form

#### Scenario: Forms step down on a small window
- **WHEN** the surface is narrowed until a region’s widest form no longer fits
- **THEN** the region steps down to its next form, as the kind’s forms list them, and no region is cramped

#### Scenario: Less room than the smallest form
- **WHEN** a document gives a region a share too small for even its smallest form
- **THEN** the region draws its smallest form and is marked as cramped, and the region beside it keeps its own share
