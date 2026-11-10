# Master strip port (lane 7)

## Implementation

- `MasterStrip.model.ts`: source DOM/classes/order, inline control props, hints, transport/tempo/clock, both FX selectors and their keyed parameters/power/high-pass, master sends/filter/Trim/EQ, stereo samplers, effects/tails and phones popovers, and crossfader. The host still owns all state and musical policy.
- The Trim/High/Mid/Low group uses the deck lane's pure `knobStackTree([...])` directly, in that source order. This preserves the shared stack DOM without an extra wrapper or reliance on a `children` slot; its callbacks remain handler keys. `MusicKnobStack` registration is not needed by MasterStrip.
- `MasterStrip.tsx` / `MasterStrip.svelte`: one `Tree` each, sharing the pure view and handlers. The original `MixerViewProps` API is retained as `MasterStripProps`; `theme` remains accepted but unused by this face, as in the source.
- `MasterStrip.fixtures.ts` / `MasterStrip.stories.tsx`: `Music/Master`, using `fixtureStories`, `withRenderer`, `withMusicScope`, and `withLibraryTheme`. The isolated frame supplies the source's 156px six-row grid slot, without forcing a pack.
- `MasterStripHost.story.ts` owns the story-only controlled host state and command echoes, shared by `MasterStripHost.react.story.tsx` and `MasterStripHost.story.svelte`. Both hosts render the actual production MasterStrip bindings and default central registries, without adding DOM or changing Storybook args during a play.
- No edits to shared mixer CSS, registries, public exports, original widgets, or any other lane.

## Registry integration (lead)

The following **component** entries are required in both registries (integrated by the lead; no new stores):

| Registry key | React export / file | Svelte default file |
| --- | --- | --- |
| `MusicMasterStrip` | `MasterStrip`, `Music/mixer/MasterStrip.tsx` | `Music/mixer/MasterStrip.svelte` |
| `MusicButton` | `Button`, `Music/controls/Button.tsx` | `Music/controls/Button.svelte` |
| `MusicToggle` | `Toggle`, `Music/controls/Toggle.tsx` | `Music/controls/Toggle.svelte` |
| `MusicButtonFace` | `ButtonFace`, `Music/controls/ButtonFace.tsx` | `Music/controls/ButtonFace.svelte` |
| `MusicKnob` | `Knob`, `Music/controls/Knob.tsx` | `Music/controls/Knob.svelte` |
| `MusicNumberField` | `NumberField`, `Music/controls/NumberField.tsx` | `Music/controls/NumberField.svelte` |
| `MusicSelect` | `Select`, `Music/controls/Select.tsx` | `Music/controls/Select.svelte` |
| `MusicSlider` | `Slider`, `Music/controls/Slider.tsx` | `Music/controls/Slider.svelte` |
| `MusicContextControls` | `ContextControls`, `Music/mixer/ContextControls.tsx` | `Music/mixer/ContextControls.svelte` |
| `MusicSeparator` | `Separator`, `Music/mixer/Separator.tsx` | `Music/mixer/Separator.svelte` |
| `MusicMixerSection` | `MixerSection`, `Music/mixer/Separator.tsx` | `Music/mixer/SeparatorSection.svelte` |
| `MusicFrameMeter` | `FrameMeter`, `Music/mixer/frames.tsx` | `Music/mixer/frames.FrameMeter.svelte` |

`MusicFrameMeter.sample` is supplied through `on` handler keys (`meter:Left`, `meter:Right`), never as a function inside tree props. Its own store registration must adapt that callback through `keyed()` as specified by lane 5. All other callbacks also travel through component `on` keys. The two SVG helpers are local pure trees; no icon component/store registration is required.

## Story coverage

`Default`, `Transport`, `FXSelection`, `HostCallbacks`, `EffectsAndPhones`, `NullValues`, `ExternalTransport`, `PlaybackUnavailable`, `ReadOnlyEffects`, `TailsDecaying`, `NoEffects` each include plays. They cover original callback arguments, host echoes, independent slots, parameter replacement/defaults, bypass/high-pass, popup open/dismiss/focus, keyboard context access, clearing tails, phones, stereo reader use, transport availability, crossfader descriptions, missing optional capabilities, and nullish readings. `NullValues` explicitly casts JavaScript-host null readings at the fixture boundary; it does not widen the source TypeScript API.

The source deliberately enables **Clear tails only while global FX is bypassed**. That predicate is preserved, not redesigned.

## Checks / limitations

- Follow-up stack integration changed only `MasterStrip.model.ts` and this handoff. No additional build/typecheck was run; the lead handles integration checks.
- Historical initial-port `npm run typecheck` ran twice: no remaining `MasterStrip*` diagnostics after correcting story typing; concurrent controls/frames/WaveControls story errors and `layout/assembly/units.ts:154` blocked that overall check at the time. No full typecheck/build was rerun during browser QA; the lead handles current integration checks.
- Direct Svelte compiler build check of `MasterStrip.svelte` and `MasterStripHost.story.svelte`, for both `client` and `server`: passed, zero warnings; no generated files were written.
- The strict browser runner now passes all **11 Master stories × 2 renderers = 22 plays**, with no failures, flaky runs, HMR interruptions/recoveries, Storybook exceptions, or console errors in the final clean run. Details below. No model/helper/snapshot/unit suites were added or run.
- Svelte files are not covered by the repo's TypeScript checker. The bindings use the same existing `Tree.svelte` pattern as other converted components.
- No servers, worktrees, or commits were created. Source edits remain within `Music/mixer/MasterStrip*`; the requested browser runner wrote its ignored artifacts under `.shots/music-master-fix/`.

## Browser QA follow-up: ten stable callback failures

The reported failures reproduced before the fix: `EffectsAndPhones`, `FXSelection`, `HostCallbacks`, `ReadOnlyEffects`, and `Transport`, in both renderers. An embedded browser check isolated the cause: clicking Pause changed host state from running to stopped, but the **same spy object** had an empty call history immediately after `updateArgs` triggered Storybook's args rerender. The production callback was forwarded; the story's args-based host was resetting its instrumented mock history mid-play.

Exact fixes, limited to stories/handoff:

1. Replaced the `holdMaster` / `useArgs` decorator with the shared story-only host store and two minimal renderer hosts. React subscribes with `useSyncExternalStore`; Svelte subscribes to the same store. Both keep production MasterStrip mounted while forwarding every callback to the original spies and echoing current host state.
2. Retained all original command assertions and all eleven plays. No callback assertion was weakened or removed.
3. Removed the phones popup's conditional reopen workaround. The play now checks that the same dialog remains mounted and its level becomes zero after the echoed callback, before editing the Cue / Master blend. This tests production update/lifecycle behaviour rather than compensating for a fixture remount.
4. No changes to production model, bindings, CSS, component registries, source geometry, or callback APIs in this QA pass. The original widgets' `MasterStrip.tsx` was rechecked for callback and capability semantics.

Command:

```sh
node scripts/music-stories.mjs --prefix music-master --renderer both --output .shots/music-master-fix
```

Reports retained under `.shots/music-master-fix/`:

| Report | Result |
| --- | --- |
| `stories-2026-10-29T21-22-45-228Z.json` | Baseline reproduced: 12/22 passed, the same ten callback failures. |
| `stories-2026-10-29T21-24-40-419Z.json` | Intermediate harness compile failure: `$host` is a reserved Svelte rune. Renamed the local store variable to `mixer`; no error suppression. |
| `stories-2026-10-29T21-25-10-431Z.json` | 22/22 passed; four cases recovered on clean retries after HMR. |
| `stories-2026-10-29T21-25-49-445Z.json` | **Final clean run: 22/22 passed; zero failures/flaky/HMR recoveries.** All 22 were actual plays against the default central registries. |
