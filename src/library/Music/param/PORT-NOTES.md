# Lane 3: parameters

## Integration (lead-owned files)

React component registry imports and entries:

```ts
import { Knob as MusicKnob } from '../Music/controls/Knob';
import { Slider as MusicSlider } from '../Music/controls/Slider';
import { NumberField as MusicNumberField } from '../Music/controls/NumberField';
import { Widget as MusicWidget } from '../Music/controls/Widget';
// entries: MusicKnob, MusicSlider, MusicNumberField, MusicWidget
```

Svelte component registry imports and entries:

```ts
import MusicKnob from '../Music/controls/Knob.svelte';
import MusicSlider from '../Music/controls/Slider.svelte';
import MusicNumberField from '../Music/controls/NumberField.svelte';
import MusicWidget from '../Music/controls/Widget.svelte';
// entries: MusicKnob, MusicSlider, MusicNumberField, MusicWidget
```

Store registry imports and entries:

```ts
import { bindParamGesture as bindMusicParamGesture, type ParamGestureParams as MusicParamGestureParams } from '../Music/gesture/paramGesture';
import { bindNumberFieldEditor as bindMusicNumberFieldEditor, type NumberFieldEditorParams as MusicNumberFieldEditorParams } from '../Music/controls/NumberField.input';
import { bindWake as bindMusicWake, type WakeOptions as MusicWakeOptions } from '../Music/controls/wake';

musicParamGesture: keyed<MusicParamGestureParams, 'onChange' | 'onRelease' | 'onDepth' | 'onEdit'>(bindMusicParamGesture, ['onChange', 'onRelease', 'onDepth', 'onEdit']),
musicNumberFieldEditor: keyed<MusicNumberFieldEditorParams, 'onDraft' | 'onCommit' | 'onCancel'>(bindMusicNumberFieldEditor, ['onDraft', 'onCommit', 'onCancel']),
musicWake: keyed<MusicWakeOptions, never>(bindMusicWake, []),
```

The lead has integrated the central registrations. Public consumers use the lead-owned `Music` namespace, keeping legacy root exports intact. The framework-free Param/format APIs are in `param/param.ts` and `param/format.ts` with their source names and behavior.

All continuous controls use `musicParamGesture`. Slider supports both orientations, source default length (27), element travel, inside layout, fill origin, signed depth and wake. The root, caption, body and readout retain the source classes. CSS is imported by each thin binding from `controls/parameters.css`; theme aliases come from the surrounding `.zen-music` scope, never an inner fixed theme.

`gesture/useParamGesture.ts` is a compatibility import path for the plain-TS store/types, not a React hook. `gesture/pendingValue.ts` supplies framework-free pending-readback state with `push/release/update/destroy`, plus `readbackTolerance`; the matching old filename re-exports it. No host-specific hooks are required by the mixer lanes.

## Stories

`Music/Controls/Knob`, `Music/Controls/Fader`, `Music/Controls/NumberField` use `fixtureStories` with React and Svelte shared-tree controlled hosts, and decorators `[withRenderer, withMusicScope, withLibraryTheme]`. Every default and disabled example has a play. The common play covers grab-without-jump, drag, fine taken mid-drag, host update while dragging (must not re-anchor), release, external host update, normal/fine keyboard steps, Home/End/PageDown, double-click reset and Escape rollback. Fader also exercises horizontal travel and signed-depth row behavior; NumberField has typing/commit/cancel/blur-clamp coverage. Source-like bipolar, tapered, channel and authoritative-readout examples are included.

## Checks actually run

- `npx vitest run src/library/Music/gesture/paramGesture.lifecycle.test.ts`: **4/4 passed**. This is only lifecycle coverage: unmount cancels queued writes/removes listeners/releases capture; capture loss flushes once through the latest callbacks; editor commits only once and detaches; wake clock cancels.
- Latest `npm run typecheck`: **passed**, after central integration and the numeric-entry story repair. Earlier checks were blocked by other in-progress lanes; no unrelated files were changed here.
- Direct `svelte/compiler` client compilation: all five Svelte files (Knob, Slider, NumberField, Widget and the controlled story harness) compiled without warnings.
- Existing Storybook `6023` indexes all 16 stories. **18/18 browser play runs passed**, with `storyFinished: success`, no page errors and no console errors: Default/Disabled for each control, Fader/Horizontal, Fader/DrivenRow, NumberField/TypedEntry, each with Renderer React and Svelte. Numeric entry uses native input/key events in its play to avoid Storybook/React's unawaited-act warning from `userEvent.type`; commit, cancel and blur/clamp assertions still run in both renderers.
- At 1280×720, compared the original `6024` Four-decks story against `6023` with `theme:mixflow;mode:dark;renderer:react`. All four complete channel-fader body crops have **zero differing pixels**. Their `::before` dimensions and offsets also match. This was an in-memory, parameter-only comparison; the lead owns the full screenshot-script rerun.
- Browser isolation check: outside `.zen-music`, a test widget remains `display:block`, its dial stays 100px (the test container width), and its arc keeps the browser's 1px stroke. As its own `.zen-music.wdg-widget` root, it is `inline-flex`, its dial uses the supplied 40px variable, and its arc is 4px. Thus parameter styles neither leak nor lose own-scope-root behavior.
- No model/helper/snapshot tests or whole suites were added or run. No servers, commits, worktrees, public exports, central registries or mixer CSS were changed by this lane.

## Deliberate lifecycle adaptations

The renderer-specific source hook became `bindParamGesture` (`update`/`destroy`). Keys are committed before `onRelease`, rather than leaving their write queued behind release, and rapid key presses bridge a controlled host's next render. Drag writes remain frame-coalesced, capture loss/cancel settles, Escape restores the value/depth, transformed geometry uses source scaling, and double-click-after-drag is suppressed. Knob pointer focus is shared DOM state. Number editor text uses Zen's shared `viewState` subscription pattern; the stores own all editor events/focus/teardown.

## Fader slot visual repair / CSS boundary

The thin vertical slot difference was a generated-content reset mismatch: original `shared.css` applies border-box to `.wdg` and its elements, **not** pseudo-elements. Zen's Music reset includes pseudo-elements, shrinking the slot from 8px content + 2px borders to 8px total. `parameters.css` now restores `content-box` on the slider body's `::before`, without editing mixer CSS or changing the track geometry. All parameter rules live under a zero-specificity `:where(.zen-music, .zen-music *)` scope; matching the scope node itself preserves standalone surface roots.
