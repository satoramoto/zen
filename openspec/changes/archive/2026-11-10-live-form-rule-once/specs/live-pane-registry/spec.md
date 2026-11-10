# live-pane-registry Spec Delta

## ADDED Requirements

### Requirement: An app defines its own pane kinds

The surface SHALL take the app’s pane definitions as plain data, each naming its kind, its label, an optional description, its forms, its priority and whether it brings its own plate and head, and the binding targets it can follow, and SHALL draw each region in a slot the app fills for that instance.

#### Scenario: An app’s own pane
- **WHEN** an app defines a kind the surface has never seen and a tab holds an instance of it
- **THEN** the region shows the app’s content for that instance at a size from the kind’s own forms

#### Scenario: The slot knows its instance
- **WHEN** a tab holds two instances of one kind with different bindings
- **THEN** the app’s slot is asked for each instance with that instance’s id, title and resolved target

## REMOVED Requirements

### Requirement: The app defines its pane kinds

**Reason**: Restated as “An app defines its own pane kinds” without its form scenario: which form a region draws is the layout’s rule.

**Migration**: Read “An app defines its own pane kinds” here, and “A region draws the largest form its room fits” in live-panel-layout for the form scenario.
