# Deck port (lane 6)

## Integration contract

- `DeckStrip.model.ts`: `deckStripModel(props)` returns `{ tree, handlers }` in one pass; `deckStripView(props)` and `deckStripHandlers(props)` are also exported. Bindings keep the source `DeckStrip` props.
- Controls are composed as `MusicButton`, `MusicToggle`, `MusicButtonFace`, `MusicKnob`, `MusicSlider`, `MusicSegmented`, `MusicContextControls`, `MusicMomentary`, and `MusicFrameMeter`, retaining original prop names. All callback props are mapped through `on` handler keys, including meter `sample`.
- Context controls need their source `children` and `face` slots. Button/Toggle/ButtonFace/Momentary need `children`.
- Frame meter needs source `sample(): number`, not a frame object prop. The deck samples each stereo channel independently, with missing readings returning zero.
- `KnobStack.model.ts` exports `knobStackTree(knobs, { stems?, full? })` for a composite's already-built child trees. **Master lane must use this helper or pass explicit numbered slots and `count`.** `component('MusicKnobStack', {}, { slots: { children: [...] } })` cannot split a fragment/snippet into alternating columns in both renderers. `Separator.model.ts` similarly exports `separatorView()` and `mixerSectionTree(className, children)`.
- The deck uses the pressables lane's existing `phonesIconView()` from `ContextControls.model.ts` (the same source SVG).

## Registry entries (lead only)

React component imports/entries:

```ts
import { DeckStrip as MusicDeckStrip } from '../Music/mixer/DeckStrip';
import { KnobStack as MusicKnobStack } from '../Music/mixer/KnobStack';
import { Separator as MusicSeparator, MixerSection as MusicMixerSection } from '../Music/mixer/Separator';
import { StemConnections as MusicStemConnections } from '../Music/mixer/StemConnections';
// MusicDeckStrip, MusicKnobStack, MusicSeparator, MusicMixerSection, MusicStemConnections
```

Svelte entries are the corresponding defaults from `DeckStrip.svelte`, `KnobStack.svelte`, `Separator.svelte`, `SeparatorSection.svelte`, `StemConnections.svelte`.

Store:

```ts
import { bindStemConnections, type StemConnectionsParams } from '../Music/mixer/StemConnections.store';
musicStemConnections: keyed<StemConnectionsParams, never>(bindStemConnections, []),
import { bindDeckHost, type DeckHostParams } from '../Music/mixer/DeckStrip.host';
musicDeckHost: keyed<DeckHostParams, 'onCapture'>(bindDeckHost, ['onCapture']),
```

`KnobStack` composites need no additional registry entry: the helper draws the same two-column DOM directly. The standalone binding accepts numbered `knob0`, `knob1`, … slots plus `count`, and React additionally accepts source-style `children` (count inferred).

`deckProps` class, inline styles, native attributes and event callbacks are converted in the model. Normal events use `on`; `musicDeckHost` preserves capture-phase handlers when supplied. Host callback refs use the existing `ref` store. No React values are imported by the deck model or lifecycle stores.

The lead can inline `deckStripView(props)` together with scoped `deckStripHandlers(props)` using `Music/compose.ts`; `MusicDeckStrip` component registration is optional in that composition. Neither helper embeds commands, readFrame, or callback functions in tree data.

## Stories

`DeckStrip.stories.tsx` is titled `Music/Deck`, uses `treeStory`, and has decorators `[withRenderer, withMusicScope, withLibraryTheme]`. Static realistic fixtures include four/six stems, queued launch/pending stops, full mix, pending loop, unavailable/loading/empty decks, and absent host capabilities. Plays exercise launching/stopping, every loop command and settings, route/phones/full mix, transport/cue takeover/beat jump, channel controls, and measured stem routing. The isolated story inherits the source six-row subgrid through `.play-decks`; no pack is forced.

## Ownership

Only `DeckStrip*`, `KnobStack*`, `Separator*`, `StemConnections*`, and this handoff are changed by lane 6. No CSS, host model, registry, exports, control, or frame files are modified.

## Checks actually run

- `npx vitest run src/library/Music/mixer/StemConnections.hook.test.ts src/library/Music/mixer/DeckStrip.host.test.ts`: **passed**, 3 lifecycle tests in 2 files. They cover dial geometry on resize, unique masks, cancellation/disconnect on destroy, and native host capture-handler update/removal. No model/helper/snapshot tests were added or run.
- Compiled `DeckStrip.svelte`, `KnobStack.svelte`, `Separator.svelte`, `SeparatorSection.svelte`, and `StemConnections.svelte` with Svelte's client compiler: **passed**.
- `npm run typecheck`: **passed** after central integration (2026-10-29, 21:19 UTC).
- After central integration, fixed the Svelte `each_key_duplicate` error by namespacing the flattened hotcue grid's heading, section, cell, and stop-button keys. **Keys only:** no DOM, class, style, handler, or command changes.
- `node scripts/music-stories.mjs --prefix music-deck-- --id music-four-deck-mixer--reference --renderer svelte --workers 2 --retries 0 --output .shots/music/deck-key-fix`: 17/19 passed; `QueuedLaunchAndStop` and `RoutingAndPhones` were HMR-interrupted, not assertion/render failures. Report: `.shots/music/deck-key-fix/stories-2026-10-29T21-18-25-646Z.json`.
- Clean Svelte rerun of those two interrupted stories: **2/2 passed**, report `.shots/music/deck-key-fix/stories-2026-10-29T21-19-07-781Z.json`. Combined browser coverage: **all 18 Deck stories pass in Svelte (17 plays, Loading render-only), and the full Four-deck Reference renders successfully in Svelte**. The runner observes Storybook exceptions/error displays as well as page errors, so the duplicate-key failure cannot be mistaken for a pass.
- No unit tests were run for the key fix, and no server was started or stopped by this lane. Pixel-fidelity comparison remains with the lead; the key-only fix leaves the React DOM unchanged.
