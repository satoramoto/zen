# Lane 2: pressables integration

All files are local to `Music/controls/{Button*,ButtonFace*,Toggle*,Segmented*,Select*,Popup*,Label*,pressables.css}` and `Music/mixer/{Momentary*,ContextControls*}`. Original class anatomy and local export names are preserved. No production dependency on widgets.

## React component registry

Imports (relative to `src/library/view/reactComponents.ts`):

```ts
import { Button as MusicButton } from '../Music/controls/Button';
import { ButtonFace as MusicButtonFace } from '../Music/controls/ButtonFace';
import { Toggle as MusicToggle } from '../Music/controls/Toggle';
import { Segmented as MusicSegmented } from '../Music/controls/Segmented';
import { Select as MusicSelect } from '../Music/controls/Select';
import { Popup as MusicPopup } from '../Music/controls/Popup';
import { Label as MusicLabel, Divider as MusicDivider } from '../Music/controls/Label';
import { Momentary as MusicMomentary } from '../Music/mixer/Momentary';
import { ContextControls as MusicContextControls, PowerIcon as MusicPowerIcon, PhonesIcon as MusicPhonesIcon } from '../Music/mixer/ContextControls';
```

Registry entries: `MusicButton`, `MusicButtonFace`, `MusicToggle`, `MusicSegmented`, `MusicSelect`, `MusicPopup`, `MusicLabel`, `MusicDivider`, `MusicMomentary`, `MusicContextControls`, `MusicPowerIcon`, `MusicPhonesIcon` (all shorthand).

## Svelte component registry

The same names import defaults at:

```ts
import MusicButton from '../Music/controls/Button.svelte';
import MusicButtonFace from '../Music/controls/ButtonFace.svelte';
import MusicToggle from '../Music/controls/Toggle.svelte';
import MusicSegmented from '../Music/controls/Segmented.svelte';
import MusicSelect from '../Music/controls/Select.svelte';
import MusicPopup from '../Music/controls/Popup.svelte';
import MusicLabel from '../Music/controls/Label.svelte';
import MusicDivider from '../Music/controls/LabelDivider.svelte';
import MusicMomentary from '../Music/mixer/Momentary.svelte';
import MusicContextControls from '../Music/mixer/ContextControls.svelte';
import MusicPowerIcon from '../Music/mixer/ContextControlsPowerIcon.svelte';
import MusicPhonesIcon from '../Music/mixer/ContextControlsPhonesIcon.svelte';
```

## Store registry

Imports (relative to `src/library/view/stores.ts`):

```ts
import { bindToggleMomentary } from '../Music/controls/Toggle.input';
import { bindSegmented as bindMusicSegmented } from '../Music/controls/Segmented.input';
import { bindSelect as bindMusicSelect, bindSelectMenu as bindMusicSelectMenu } from '../Music/controls/Select.input';
import { bindPopup as bindMusicPopup } from '../Music/controls/Popup.input';
import { bindMomentary as bindMusicMomentary } from '../Music/mixer/Momentary.input';
import { bindContextControls, bindContextPanel } from '../Music/mixer/ContextControls.input';
```

Exact entries (type inference is enough):

```ts
musicToggleMomentary: keyed(bindToggleMomentary, ['onHold']),
musicSegmented: keyed(bindMusicSegmented, ['onChange']),
musicSelect: keyed(bindMusicSelect, ['onState', 'onChange']),
musicSelectMenu: keyed(bindMusicSelectMenu, ['onState', 'onChange']),
musicPopup: keyed(bindMusicPopup, ['anchor', 'within', 'onDismiss']),
musicMomentary: keyed(bindMusicMomentary, ['onHold', 'onTakeover']),
musicContextControls: keyed(bindContextControls, ['onPress', 'onOpen']),
musicContextPanel: keyed(bindContextPanel, ['onOpen']),
```

## Consumers and CSS

- React `children` and `ContextControls.face` are slots; the corresponding Svelte props are snippets. Composite trees pass them through `component(..., { slots: { children: [...], face: [...] } })`.
- `powerIconView()` and `phonesIconView()` export plain SVG trees from `mixer/ContextControls.model.ts`, also re-exported from the React module. `PowerIcon` and `PhonesIcon` remain named React exports. Use the plain helpers from models, not imports from `.tsx`.
- `itemsOf()` remains exported by `Segmented.tsx` and its framework-free model.
- ButtonFace keeps native attributes, modifiers, pointer/key callbacks and React `ref`; shared callbacks receive native DOM events rather than React synthetic events.
- Popup accepts source live ref/remembered-box anchors, plus an accessor for Svelte. Accessors and dismissals enter stores only as handler keys.
- Every binding imports `pressables.css`. Select/Toggle/Segmented geometry is local there and scoped with zero-specificity `:where(.zen-music)`; colours read only the original CSS aliases. Shared reset/tokens come from `Music/base.css`/the host's `.zen-music` boundary. Context panel and cue transport styling remains the lead-owned `mixer.css`; their stories import it.
- Momentary owns one pointer/key, releases exactly once on cancel/capture loss/window blur/disable/unmount, supports Space + Enter takeover and assistive click. Momentary Toggle additionally springs back on pointer leave and supports keyboard/cancel lifecycle (the source missed keyboard cleanup).
- Stories use `[withRenderer, withMusicScope, withLibraryTheme]`; no forced inner theme. Registry integration is needed before running the component-tree stories.
- Toggle, Segmented, Select and Momentary also have **Live** stories. `ToggleHarness*` is a story-only, framework-free controlled host shared by React and Svelte, so changes actually light the switch/cue, update the selected text, and move radio focus. External Storybook Controls changes resynchronise the host. Its local `musicPressableHost` store/renderer maps need **no central registration or public exports**.
- **Standalone story scope:** current `theme.css` declares `--wdg-*` only on `.wdg`. The original mixer host is `.wdg.play-example`. `withMusicScope` currently supplies `.zen-music` alone, so standalone ButtonFace/ContextControls/Momentary and generic Popup stories have missing face/fill aliases. Either include `.zen-music` itself in the theme's alias selector, or make the story boundary `className="zen-music wdg"`. Do not add `.wdg` to the standalone button itself (that changes anatomy and resets caller-owned ink). The final browser galleries used the source-equivalent `.zen-music.wdg` host.

## Checks

- `npx vitest run src/library/Music/mixer/Momentary.lifecycle.test.ts src/library/Music/controls/Popup.lifecycle.test.ts`: **passed**, 2 files / 4 lifecycle tests. No model/helper/snapshot suites were added or run.
- `npm run build:storybook`: **passed**. The React and Svelte bindings compile. Only existing Show/parameter-harness initial-value warnings and normal chunk-size warnings.
- `npm run typecheck`: **passed** on the final run. The unrelated `layout/assembly/units.ts:154` error seen earlier was fixed elsewhere while the shared worktree was in progress.
- Chromium on the already-running `6023` server: **52 story-play executions passed**, 26 plays × React/Svelte, zero page errors. Until lead registry integration, a temporary external harness supplies the documented component/store maps **only in that browser's module instances** (no central file edits). It imports and executes the actual story `play` functions and the actual React/Svelte bindings, not a second implementation.
- Browser visual inspection: both renderers at 360px in mixflow/dark and 900px in linear/light; no horizontal overflow. React/Svelte control geometry and source classes match. Screenshots and the repeatable harness are outside the repo under `/run/user/1000/ggg/3ce01bc92a31f243ce1d/tmp/opencode/`: `music-pressables-browser.mjs` (`node ... --shots`), `music-pressables-{react,svelte}-{360,900}.png`.
