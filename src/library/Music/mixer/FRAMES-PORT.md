# Lane 5: meters, frame-bound drawings and waveform input

Local React exports retain source names:

- `music/Meter.tsx`: `Meter`, `MeterProps` (`Meter.model.ts` is framework-free; matching `Meter.svelte`).
- `mixer/frames.tsx`: `FrameMeter`, `FramePlayhead`, `FrameWaveform` and their props.
- `mixer/WaveControls.tsx`: `WaveControls`, `WaveControlsProps` (matching `WaveControls.svelte`).

## Central registrations (lead-owned)

React component map:

```ts
MusicMeter: Meter,                       // ../Music/music/Meter
MusicFrameMeter: FrameMeter,             // ../Music/mixer/frames
MusicFramePlayhead: FramePlayhead,
MusicFrameWaveform: FrameWaveform,
MusicWaveControls: WaveControls,         // ../Music/mixer/WaveControls
```

Svelte component map (same keys):

```ts
import Meter from '../Music/music/Meter.svelte';
import FrameMeter from '../Music/mixer/frames.FrameMeter.svelte';
import FramePlayhead from '../Music/mixer/frames.FramePlayhead.svelte';
import FrameWaveform from '../Music/mixer/frames.FrameWaveform.svelte';
import WaveControls from '../Music/mixer/WaveControls.svelte';
```

Store imports/entries, from `mixer/frames.bind.ts` and `mixer/WaveControls.input.ts`:

```ts
musicFrameMeter: keyed<FrameMeterParams, 'sample'>(bindFrameMeter, ['sample']),
musicFramePlayhead: keyed<FrameReadParams, 'readFrame'>(bindFramePlayhead, ['readFrame']),
musicFrameWaveLane: keyed<FrameWaveLaneParams, 'readFrame'>(bindFrameWaveLane, ['readFrame']),
musicFramePosition: keyed<FrameReadParams, 'readFrame'>(bindFramePosition, ['readFrame']),
musicWaveControls: keyed<WaveControlsParams, 'readFrame' | 'moveDeck' | 'setFocus'>(bindWaveControls, ['readFrame', 'moveDeck', 'setFocus']),
```

Component dependencies supplied by other lanes: `MusicWaveform`, `MusicButtonFace` (`onClick`), `MusicContextControls` (`children` and `face` slots), `MusicMomentary` (`onHold`/`onTakeover`, `children` slot). In particular the context face is a **slot subtree**, not a string prop (Svelte needs a snippet). Shared `base.css` and lead's `mixer.css` are imported, never changed here. Meter owns only `Meter.css` (component-specific reference rules; wrapper styles stay in base).

### Inlining into the root (function-free output)

Import the following **plain `.model.ts` files**, not renderer values:

```ts
// frames.model.ts
frameMeterView(props: FrameMeterProps): Node
frameMeterHandlers(props: FrameMeterProps): Handlers
framePlayheadView(props: FramePlayheadProps): Node
framePlayheadHandlers(props: FramePlayheadProps): Handlers
frameWaveformView(props: FrameWaveformProps): Root
frameWaveformHandlers(props: FrameWaveformProps): Handlers
// WaveControls.model.ts
waveControlsView(props: WaveControlsProps, children?: Root): Root
waveControlsHandlers(props: WaveControlsProps): Handlers
```

`waveControlsView(props)` defaults to `slot('children')`; `waveControlsView(props, frameWaveformView(frameProps))` instead inlines the actual child tree. Scope the waveform subtree and its handlers **first**, then scope WaveControls' own keys. Merge each returned handler map with the lead's scoped-handler helper. This avoids collisions between `readFrame`, `moveDeck`, `setFocus`, `focus:<laneId>`, etc. across decks. `commands` is consulted only to create handlers/capability flags, never emitted in `ComponentNode.props`; neither `readFrame` nor any other callback is put in props/store params. Only the handler maps contain functions. Models do not call `readFrame` during tree construction.

## APIs / fidelity

- Public props and commands match `model.ts` and original widgets. `FrameMeter.sample`, all `readFrame`s, `moveDeck` and `setFocus` enter stores as handler keys through `keyed()`, never callback values in a tree.
- Original `wdg`/`play-*` DOM, 210px vertical mixer meter, attack 35ms/release 140ms, 100ms elapsed cap and near-zero settling are preserved. Meter remains read-only, not a slider; values/peaks clamp finite 0–1.
- No React/Svelte frame state or mixer-wide rerenders: stores change only fill/ARIA, scrolling strips, playheads, slip markers and position text. Each lane owns a scoped loop, which follows its own source beat (deck beat fallback), latest range/readFrame and fixed/scrolling geometry. Every loop cancels on destruction. `readFrame` only reads; no preview clock is advanced.
- Markers retain source-space cue/stem-cue/loop geometry, separate source focus, single-lane label/top offsets, slip clamping to 0–98%, beat/bar/faint grids, negative playhead wrapping and source-local background positions.
- Wave input starts a host `begin` transaction, emits **relative-from-origin** deltas, then `commit` or `cancel`. Pointer identity/capture and keyboard focus survive state updates; Escape, pointer cancel/lost capture, element/window blur, deck replacement, disable and unmount roll back. A committed capture release cannot cancel again. Arrow movement is ⅛ beat or Shift one beat; up/down cycle available stems only. Full/stem play/cue and takeover use their original commands.
- The waveform slider's live ARIA follows deck seconds/duration (as in the reference); moving/focusing sources is host command policy. Input keeps the source's original `setStemPlaying` capability gate even in full mode.
- Safety differences: zero-width pointer surfaces cannot begin invalid movements; unrelated pointer releases cannot commit another pointer's transaction; non-ready inputs ignore movement keys; missing waveform ranges draw nothing.

## Evidence / remaining limits

Dual-renderer stories: `Music/Meter`, `Music/Mixer/Frames`, `Music/Mixer/Wave Controls`. Plays cover meter geometry/reading/clamping, independent lane geometry/slip/focus/marks, fixed whole-track marks, smoothed meter, wrapped negative playhead, relative gestures, rollback and keyboard/full-source command semantics. Frame/input specimens supply the sized flex parent the real mixer provides (96px here, to inspect both source lanes), rather than rendering zero-height fragments; this does not change component geometry. SmoothedMeter also supplies the host's `--play-signal` alias and checks that the fill is not transparent. Lifecycle-only tests are alongside the stores. No unit/helper/snapshot suites were added.

Checks:

- `npx vitest run src/library/Music/mixer/frames.lifecycle.test.ts src/library/Music/mixer/WaveControls.lifecycle.test.ts`: **7/7 passed**.
- `npm run typecheck`: **exit 0** after the other lanes' concurrent fixes.
- `npm run build:storybook` and the final `npm run build:storybook -- --quiet`: **exit 0** (unrelated existing Svelte state-capture/chunk-size warnings).
- Playwright against the existing `6023` preview: all six Meter stories completed with `storyFinished: success` under React and Svelte at **360×640**. Also rendered/measured all six at 900×700; vertical meter is 6×60px.
- The four frame plays and six input plays were exercised against each renderer's actual `Tree` with **test-local browser-memory store/component registrations**, without modifying central files: final rerun **20/20 passed** at 900×700. This includes actual waveform/context/momentary component dependencies, nested lane focus followed by gesture begin, rollback, source cue/takeover, scope and zoom. The negative-playhead assertion uses numeric tolerance because browser CSS serialization rounds `99.21875%` to `99.2188%`.
- After the lead added the registrations through `Music/registry.{react,svelte,stores}.ts`, all ten frame/input stories were run normally in Storybook, **without runtime injections**, at **900×700 and 360×700**, React and Svelte: **40/40 `storyFinished: success`, zero page errors**. Together with the narrow Meter stories, that is **52 successful default-registry story runs**.

Remaining limits: the lead's complete assembled MixerView/reference screenshot comparison and final public-package build/check remain the lead's integration evidence, not this lane's. Central registration source files were not edited here. This lane starts no servers and adds no unit/helper/snapshot suites. All code edits stay in `music/Meter*`, `mixer/frames*`, `mixer/WaveControls*` and this requested handoff file; no commits/worktrees were created.
