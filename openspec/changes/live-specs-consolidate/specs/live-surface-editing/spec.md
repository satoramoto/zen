# live-surface-editing Spec Delta

## MODIFIED Requirements

### Requirement: Intents can be applied without a store

Zen SHALL provide a pure function that returns the next document for a document and any intent the surface sends, keeping no state, so an app or a story without a store of its own can apply what the surface sends; it SHALL return the document as given for an intent naming a tab, region or split the document doesn’t hold, SHALL name each tab, region and split it adds with an id the document doesn’t use unless the app gives it a namer, and SHALL never remove the last tab.

#### Scenario: Applying the surface’s own intents
- **WHEN** a story applies every intent the surface sends to the document it gives back
- **THEN** each edit appears in the surface as soon as it is made

#### Scenario: An intent that can’t apply
- **WHEN** an intent names a tab or region the document doesn’t hold
- **THEN** the function returns the document unchanged

#### Scenario: Docking through the applier
- **WHEN** a story applies a dock intent placing one region below another
- **THEN** the returned layout holds a column of the two where the target was, and the region is gone from where it was

#### Scenario: A resize naming no split
- **WHEN** a resize intent names a split the tab doesn’t hold
- **THEN** the applier returns the document unchanged

#### Scenario: The applier names what it adds
- **WHEN** an app applies an add-region intent twice with no namer of its own
- **THEN** the two new instances have different ids that no tab, region or split of the document used

#### Scenario: The app names what is added
- **WHEN** an app applies an add-tab intent with a namer of its own
- **THEN** the new tab has the id the app’s namer gave

#### Scenario: The last tab stays
- **WHEN** a document has one tab and the surface is editing
- **THEN** the tab’s Remove is disabled, and a remove-tab intent applied anyway returns the document unchanged

## REMOVED Requirements

### Requirement: Layout intents apply without a store

**Reason**: Merged into “Intents can be applied without a store”: the applier applies every intent the same way.

**Migration**: Read “Intents can be applied without a store”, which now holds its scenarios.
