# visual[flow]: principles for laying out screens

The `visuals` pack (palette `frost`, faces `instrument`, scale `roomy`, materials `frost`) is visual[flow] 1.0's look, from openflowfm/visuals (decisions 68–71, `app/src/home.css`, `layout/layout.css`, `popover.css`, `live/stage.css`). The facets carry the values; these are the rules for putting a screen together with them.

## The window is glass, the page is tint (decision 69)

- The window is transparent over macOS's HUD frost. The desktop shows through, blurred, and its colour comes with it. The page's root paints nothing (`ground` is transparent).
- Areas such as the header, sidebar, main pane and bar paint only faint tints over the frost (`--surface-0`..`-3`, the `base` and `raised` layers). Let the material carry the look; don't put a solid colour behind a region.
- Glass is only for what floats: popovers, menus, a dragged item, sheets and toasts (`float`, `overlay`, `top`). Glass is a darker fill over a blur of what's under it (`blur(28px) saturate(1.6)`), with a top edge catching the light and a lift shadow. A region on the page is never glass.

## Near borderless (decision 68)

- Tell areas apart by space and tone, not lines. Regions have no edge and their headers have no rule.
- Only three lines are left: the selection ring, the focus ring and the playing mark. Don't add a hairline to separate two things; add space or a tone step.
- Controls are type. A switch (`Segmented`, `Tabs`) is a row of words drawn like the header's glyph buttons: no track, no face, no underline, no thumb. Resting words are grey (`--text-2`, the panel toggles at rest), the chosen one white (`--text-1`), and hover brightens a resting word to white as it does an icon. Keep them tight, about the toolbar glyphs' spacing (`--space-3`). Don't draw boxes around buttons. (The owner chose plain text over both visual[flow]'s underline and Apple's segmented thumb: design-os decision 81.)
- A slider is Apple's (HIG Sliders, macOS 26 kit): a thin capsule groove (the `well`, the ink at 12%), the value filled in the primary from its origin, and a round-ended knob (the `handle`: a pale, nearly white cap with a specular top edge and a soft cast). Its name sits above at the leading edge and its reading at the trailing edge in the secondary ink, tabular, never printed inside the track (`Slider layout="row"`).

## Layout (decisions 70–71)

- One padding for the main column: 22px (`--mat-plate-inset`). The hero, notes and grid all share that left edge. Sections sit 32px apart (`--mat-plate-gap`). Insets from the window edge are 8px.
- Use an inspector layout like Finder's or Photos': an inset sidebar (240px, 18px corners, 8px in from the window), the main column, and an inspector down the right. The sidebar docks from 900px wide and the inspector from 1200px. Narrower than that, each is laid over the content when it's opened, as an opaque panel.
- Rows are 40px and use 8px pills. Controls run from about 28 to 32px. Floats have 10px corners and the hero 18px. macOS rounds the window itself.
- The header row holds only type: the panel toggles, the view switch and the view's own controls. It has no background of its own and no settings cog (Settings lives in the app menu and the sidebar's foot).

## Never translucent over the native preview

- The preview is a native view under the page, seen through a hole (`Hole`). A blur never reaches it, and anything translucent would show the picture through unblurred.
- So every panel over the preview, and every corner that rounds it, is opaque and doesn't blur. Wrap them in `Opaque`: each layer then draws its `solid` (about `#18181a` in dark mode) and its backdrop is dropped.
- Nothing may paint behind the preview's hole. Its own spread shadow paints the column around it.

## Motion

- Nothing animates. Panels, popovers and selections show or go at once. The only exceptions in the source are a hint's fade and the ring that shows Esc being held to leave Live.

## Type

- Instrument Sans everywhere: UI, titles and numbers (`instrument` faces). It's one variable face, wdth 75–100 and wght 400–700.
- Numbers use tabular figures (`font-variant-numeric: tabular-nums`), not a monospace, so columns of counts still line up. A monospace is only for real code.
- Labels are in sentence case ("Now playing"), not spaced capitals. Titles use weight 600 and the wordmark 650 with slight negative tracking.
- Instrument Sans has a narrow space, so a line joined with " · " needs its spaces widened by about 0.1em.

## Contrast

- Small grey text (captions) must be at 4.5:1 or better against the lightest the frost gets: about `#3c3c3c` for the HUD, with the page's tint laid over it. That's why the caption (`--text-3`) is `#a4a4ac` and not the widgets' `#5e5e66` (3:1), which is kept only as the faint step.
- On raised tints and glass, captions take a lighter step so they stay at 4.5:1 (home.css `--caption-raised`).
- Colour has one meaning each: green is the signal and the playing mark; the primary is selection and a slider's fill; amber is caution. Stems and decks keep their own hues and never decorate.

## Assembly

These rules are the `visuals` principles in `index.ts` beside this file, for screens assembled by `layout/assembly` ([`docs/assembly.md`](../../../../docs/assembly.md)):

- `density: 'roomy'`: space is the look (22px padding, 32px between sections), so a region keeps its ideal size and steps to a sparser form sooner.
- The preview (what's playing) is `priority: 'now'`. The sidebar and inspector are `context`, each with a `docked` form and an overlaid one. The width where each docks (900px and 1200px) comes out of their needs, not out of breakpoints.
- The header row is the spec's fixed `header`.
- `minTarget` is 24 (WCAG 2.2). The source's 22px rail controls are under it, so a screen with them never zooms them smaller.
- `gaps`: step 4 between groups (16px tiles) and step 2 between controls.
