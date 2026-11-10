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
the `foundation` folder of shared machinery, the generic tiers `primitives`, `components`,
`layouts` and `screens`, and the declared areas. The `foundation` folder SHALL hold no stories.

#### Scenario: Shared machinery is looked for
- **WHEN** a reader looks for the themes, the skins, the view tree or the Svelte helpers
- **THEN** they are under `foundation/`

#### Scenario: A generic control is looked for
- **WHEN** a reader looks for a control that carries no app meaning, the theme picker and editor among them
- **THEN** it is a folder directly under the root `components/`

#### Scenario: A whole view of the core is looked for
- **WHEN** a reader looks for the theme inspector, the preview catalog or the bring-your-own-app sample
- **THEN** it is a folder under the root `screens/`, and its story is under `Core/Screens` in the sidebar

#### Scenario: The sidebar is opened
- **WHEN** a reader opens the Storybook sidebar
- **THEN** the library's top-level groups are `Core` and one group per area

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

### Requirement: Music is one area with one folder of components
Every music part SHALL live in the `music` area or its sub-area `music/live`. The token-drawn
parts and the mix[flow] toolkit's parts SHALL sit side by side in `music/components`, each in a
folder whose name no other part there has. The area SHALL hold one meter and one transport, the
toolkit's.

#### Scenario: A reader looks for a music part
- **WHEN** a reader looks for a fader, a pad, a readout or a toolkit control
- **THEN** it is a folder under `music/components/`, and its stories are under `Music/Components` in the sidebar

#### Scenario: A reader looks for the meter or the transport
- **WHEN** a reader looks for a level meter or a transport
- **THEN** there is one of each, `Meter` and `Transport`, and they are the toolkit's

#### Scenario: A token-drawn part shows a level
- **WHEN** a token-drawn part such as the mix band shows a level, or a screen such as Yahaha's Show shows a transport
- **THEN** it draws the toolkit's meter or transport inside the toolkit's scope

#### Scenario: Two parts had the same name
- **WHEN** a reader looks for the token-drawn knob
- **THEN** it is `KnobReadout`, and `Knob` in that folder is the toolkit's

#### Scenario: An app imports a renamed part by its old name
- **WHEN** an app imports `Knob` from the package root
- **THEN** it gets the token-drawn `KnobReadout`

### Requirement: Every music file is held to the component rules
The tier rules, the bindings-only rule and the token contract SHALL cover every file of the
`music` area. Findings the mix[flow] port already has SHALL be recorded and SHALL only go down.

#### Scenario: A token-drawn part gains a tier finding
- **WHEN** a token-drawn music part adds a literal pixel size, an outer margin or its own type
- **THEN** the tier check fails, as it did before the parts moved

#### Scenario: A new music file reads outside the contract
- **WHEN** a music file that is not on the port's excuse list reads a variable outside the token contract or writes a literal colour or radius
- **THEN** the contract check fails and names the file

#### Scenario: An excused file meets the contract
- **WHEN** a file on the port's excuse list no longer reads outside the contract
- **THEN** the contract check fails until the file is taken off the list
