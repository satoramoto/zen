# Structure: where things are

Every section of `src/library` has the same folders. `src/library/structure.ts` is this page as a
checker and `src/library/structure.test.ts` runs it over the tree: a file, folder or story title
outside the rule fails with the place it belongs.

[`tiers.md`](tiers.md) says who decides what. This page says which folder that is.

```
src/library/
  index.ts  themes.ts  svelte.ts  storybook.tsx  source.css  library.css    the public entries
  contract.ts  theme.tsx  tiers.ts  structure.ts  *.test.tsx  …             the repo-wide checks and what the entries and checks read
  foundation/        shared machinery: themes/, view/, svelte/, stories/, inspector/, preview-catalog/
  primitives/<Name>/ how a thing looks: Surface, Text, Icon, Stack, Ring
  components/<Name>/ generic controls: Button, Select, Slider, Popover, …
  layouts/<Name>/    generic arrangement: Group, Region, Screen, Tabs, Layer, Assembly, Workspace
  <area>/
    index.ts         the area's entry
    *.ts  *.css  *.md   lower-case files: registries, stylesheets, helpers, notes
    model/           data and pure functions. No React, no Svelte.
    components/<Name>/
    layouts/<Name>/
    screens/<Name>/
    <sub-area>/      the same shape again
```

## The areas

| Folder | Sidebar | What it is |
|---|---|---|
| `primitives`, `components`, `layouts` | `Core/Primitives`, `Core/Components`, `Core/Layouts` | the generic tiers every area builds on |
| `music` | `Music` | every music part: the token-drawn ones (Fader, Pad, Keys, the readouts) and the mix[flow] toolkit (controls, strips, the four-deck mixer) |
| `music/live` | `Music/Live` | the live surface: panes, the control panel, the boards and DAWs |
| `graph` | `Graph` | the node graph and the Circuit model |
| `shader` | `Shader` | the shader runner and its materials |
| `report` | `Report` | the research report |
| `theme-editor` | `Theme Editor` | skins, the picker and the editor |
| `math`, `math/<topic>` | `Math`, `Math/<Topic>` | the math components; each topic (trig, fourier, primes, …) is a sub-area |
| `compendium`, `compendium/book` | `Compendium`, `Compendium/Book` | the book primitives and the sample books |
| `openspec` | `Openspec` | an OpenSpec root, read and drawn |
| `site` | `Site` | the documentation site's views |
| `yahaha` | `Yahaha` | Yahaha's redesign |

`music/components` holds two kinds of part side by side: the token-drawn ones, exported flat
from the package root (`music/root.ts`), and the mix[flow] toolkit, exported as the `Music`
namespace (`music/index.ts`). A part's folder name is unique in the folder, so where both kinds
had a `Knob`, a `Meter` and a `Transport` the token-drawn ones are `KnobReadout`, `LevelMeter`
and `TransportBar`. `docs/music.md` says which part is which.

## Where does this go?

Ask in order and stop at the first yes.

1. **Is it data or a pure function, with no renderer?** `model/`. A file there never imports
   React or Svelte, and is never a `.tsx` or `.svelte`.
2. **Is it one interaction or one drawn thing?** A component: `components/<Name>/`.
3. **Does it arrange other parts?** A layout: `layouts/<Name>/`.
4. **Is it what an app shows whole**, or a sample of the whole area (a board, a document, a
   page of every part)? A screen: `screens/<Name>/`.
5. **Is it a helper several parts of one tier share** (a hook, a shared stylesheet, an icon
   set)? A lower-case file in that tier folder (`music/components/pressables.css`).
6. **Is it used by every area and none of the above** (themes, the view tree, story helpers)?
   `foundation/`.

A generic part goes in the root tier; a part that carries an area's meaning goes in that area.

## A part is a folder

Everything about `Fader` is in `…/components/Fader/`:

```
Fader.model.ts      the view tree
Fader.tsx           the React binding
Fader.svelte        the Svelte binding
Fader.css
Fader.fixtures.ts   every story's args, as data
Fader.stories.tsx
Fader.test.ts
```

A file with a capitalised name is read as a part's file. It is never loose in a tier folder or at
an area's root. A second small part that only this one uses can share the folder
(`AppBar/MetronomePopover.tsx`), and so can a story's harness (`*.story.tsx`) and port notes.

There are no `stories/`, `view/` or `fixtures/` folders: a story sits in the part it shows.

## The sidebar mirrors the path

A stories file's `title` starts with its area's sidebar name and its tier, then names the part:

| File | Title |
|---|---|
| `components/Button/Button.stories.tsx` | `Core/Components/Button` |
| `music/components/Knob/Knob.stories.tsx` | `Music/Components/Knob` |
| `music/live/screens/Daws/DAWs.stories.tsx` | `Music/Live/Screens/DAWs` |
| `graph/screens/Circuit/Circuit.stories.tsx` | `Graph/Screens/Circuit/Samples` |
| `math/trig/components/UnitCircle/UnitCircle.stories.tsx` | `Math/Trig/Components/Unit Circle` |

Stories under `foundation/` are titled freely.

## Adding an area

An area, a sub-area and a root file are each one line in `src/library/structure.ts` (`AREAS`,
`ROOT_FILES`), added in their own small commit. A folder that is not declared fails the check, so
a new section is always a decision and never an accident.

The check has no list of exceptions. If something cannot go where this page says, change the rule
through an OpenSpec change to `library-structure`.
