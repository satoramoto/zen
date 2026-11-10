## MODIFIED Requirements

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
