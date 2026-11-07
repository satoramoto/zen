# openspec-viewer Specification

## Purpose
Reading an OpenSpec root from its files and drawing its specs and changes as documents in Storybook, so a project's plans can be looked at where its components are.

## Requirements

### Requirement: A root is read from its files

The viewer SHALL read an OpenSpec root from a map of file paths to contents, relative to the root, and SHALL recognise the config's schema, every main spec under `specs/`, every active change under `changes/`, and every archived change under `changes/archive/`.

#### Scenario: A root with specs, changes and an archive

- **WHEN** the files of a root holding two specs, two active changes and one archived change are read
- **THEN** the repo lists two specs, two changes and one archived change, each by its capability or name

#### Scenario: A freshly initialised root

- **WHEN** the files of a root holding only its config are read
- **THEN** the repo has the config's schema and no specs, changes or archive

### Requirement: A spec is drawn as a document

The viewer SHALL draw a spec with its capability, title and purpose, then each requirement as a labelled region holding its statement and its scenarios, each scenario listing its steps with the keyword (GIVEN, WHEN, THEN, AND) beside the text.

#### Scenario: Requirements and scenarios

- **WHEN** a spec with two requirements and three scenarios is drawn
- **THEN** two requirement regions appear, named for their requirements
- **AND** each scenario's steps appear in order with their keywords

### Requirement: A change is drawn with its status and deltas

The viewer SHALL draw a change with its title, whether it is active or archived, its task progress as done out of total, its proposal, its spec deltas per capability with each requirement marked ADDED, MODIFIED or REMOVED and a new capability flagged, its tasks as a read-only checklist, and its design when present.

#### Scenario: An active change with partial tasks

- **WHEN** a change with five tasks of which two are done, one new capability and one modified capability with a removal is drawn
- **THEN** it reads as active with progress 2 of 5
- **AND** the deltas show ADDED, MODIFIED and REMOVED requirements and flag the new capability

#### Scenario: A change that skips specs

- **WHEN** a change whose `.openspec.yaml` sets `skip_specs: true` is drawn
- **THEN** it says it skips specs and shows no deltas

#### Scenario: An archived change

- **WHEN** a change from the archive is drawn
- **THEN** it reads as archived with its archive date

### Requirement: A root is browsed in one view

The viewer SHALL list a root's specs, active changes and archive down one side, with each spec's requirement and scenario counts and each change's task progress, and SHALL show an overview of the root's numbers and the changes under way, or the chosen spec or change, beside the list.

#### Scenario: Opening a spec then a change

- **WHEN** a reader chooses a spec from the list and then a change
- **THEN** the spec's document appears, then the change's, and the host is told what was opened each time

#### Scenario: Narrow width

- **WHEN** the view is narrower than about 56rem
- **THEN** the list folds above the document and nothing overflows sideways

### Requirement: The project's own root is a fixture

The Storybook SHALL render this project's own `openspec/` folder, read at build time, as one of the root stories, so the spec for the viewer is drawn by the viewer.

#### Scenario: The dogfood story

- **WHEN** the Zen root story is opened
- **THEN** the `openspec-viewer` spec is listed and opens with its requirements
