# library-structure Specification

## Purpose
The folder shape of the library: which folders an area has, where each kind of file lives, how the
Storybook sidebar follows the folders, and the check that holds all of it. `docs/structure.md` is
the working guide.

## Requirements

### Requirement: Every area has the same shape
The library SHALL be a set of declared areas, each holding only its entry files, lower-case
helper files, the tier folders `model`, `components`, `layouts` and `screens`, and declared
sub-areas of the same shape.

#### Scenario: A reader looks for an area's components
- **WHEN** a reader opens any area of the library
- **THEN** its components are in `components/`, its arrangements in `layouts/`, its whole views in `screens/` and its data and pure functions in `model/`

#### Scenario: A folder outside the shape is added
- **WHEN** a folder that is neither a tier nor a declared sub-area is added to an area
- **THEN** the structure check fails and names the folder

#### Scenario: A new area is added
- **WHEN** a folder is added under the library without being declared as an area
- **THEN** the structure check fails and says where areas are declared

### Requirement: The library root holds only entries, checks, the foundation, the generic tiers and areas
The library root SHALL hold the public entry files, the repo-wide checks and the files they read,
the `foundation` folder of shared machinery, the generic tiers `primitives`, `components` and
`layouts`, and the declared areas.

#### Scenario: Shared machinery is looked for
- **WHEN** a reader looks for the themes, the view tree or the Svelte helpers
- **THEN** they are under `foundation/`

#### Scenario: A generic control is looked for
- **WHEN** a reader looks for a control that carries no app meaning
- **THEN** it is a folder directly under the root `components/`

### Requirement: Each part has its own folder
A component, layout or screen SHALL be a folder named for it inside a tier folder, holding its
model, renderers, stylesheet, fixtures, stories and tests.

#### Scenario: A component file sits loose in a tier folder
- **WHEN** a file named for a component is placed directly in a tier folder or at an area's root
- **THEN** the structure check fails and names the folder it belongs in

#### Scenario: A helper sits beside the parts that use it
- **WHEN** a lower-case helper file is placed in a tier folder
- **THEN** the structure check passes

### Requirement: The model tier has no renderer
Files under an area's `model` folder SHALL import neither React nor Svelte and SHALL NOT be
renderer files.

#### Scenario: A model file imports a renderer
- **WHEN** a file under `model/` imports React or Svelte, or is a `.tsx` or `.svelte` file
- **THEN** the structure check fails and names the file

### Requirement: Stories sit with their part and the sidebar mirrors the path
A stories file SHALL sit in the folder of the part it shows, and its sidebar title SHALL start
with its area's name and its tier.

#### Scenario: A story is opened from the sidebar
- **WHEN** a reader sees a story at `Music/Live/Screens/DAWs` in the sidebar
- **THEN** its file is under `music/live/screens/`

#### Scenario: A title does not match its folder
- **WHEN** a stories file's title does not start with its area's name and tier
- **THEN** the structure check fails and gives the expected start of the title

#### Scenario: A stories folder is added
- **WHEN** a stories file is placed outside a part's folder
- **THEN** the structure check fails
