# Transport fidelity port

Owns only `Music/music/Transport*`. Reference: `widgets/src/music/Transport.tsx`,
`Transport.stories.tsx`, and `transport.css`. Legacy `components/music/` is unchanged.

## Lead integration (not edited by this lane)

React component registry:

```ts
import { Transport as MusicTransport } from '../Music/music/Transport';
// registry:
MusicTransport,
```

Svelte component registry:

```ts
import MusicTransport from '../Music/music/Transport.svelte';
// registry:
MusicTransport,
```

Store registry:

```ts
import { bindTransportPosition, type TransportPositionParams } from '../Music/music/Transport.input';
// stores:
musicTransportPosition: keyed<TransportPositionParams, 'onUnit'>(bindTransportPosition, ['onUnit']),
```

Dependent component names: `MusicButton`, `MusicToggle`, `MusicNumberField` (their respective
controls lane implementations, in both registries). Position reuses the pure `buttonFaceView`;
no extra component registry entry is needed for it or the story harness.

Public React alias: `Transport as MusicTransport` and `TransportProps as MusicTransportProps`
from `Music/music/Transport`. Svelte alias: default export of `Transport.svelte` as
`MusicTransport`; props are `TransportModelProps` plus the Svelte `children` snippet.
Optional supporting types and original helper exports (`clockText`, `positionText`) come from
`Transport.model.ts` (also re-exported by the React binding). Keep model consumers on `.ts`.

## Fidelity and behaviour

- Source API, `wdg*` anatomy, SVGs, 26px button widths, 44px tempo field, 94px position button,
  clock minimum width/padding, typography aliases, and latency rounding are retained.
- No inner theme. Local CSS reads only original aliases. The sole deleted source CSS fallback
  is literal `#5fbfa8`; `--success` / `--green` come from the enclosing skin/theme aliases.
- Playback availability disables only play/stop, exactly as the reference. Loop, tempo and
  normal speed retain their own availability; read-only tempo uses the original raw value
  fallback rather than formatting it through `Param`.
- A shared plain-TS binding restores the guarded preference once on mount, delegates only to
  this row's direct position button, and removes its listener on destroy. Changing `remember`
  changes subsequent writes without reloading the chosen unit, as in the source. Hiding beats
  and restoring them does not lose the choice. Both renderers only read shared view state.
- Story-only controlled hosts share one plain-TS model; Controls affect all optional parts and
  readings. Presses update the visible host state and callback spies (not Storybook's args panel).
- Stories: Default, Playing, FullRow, Mixer (read-only tempo), Harness (fine clock), Disabled,
  ClockToggle, TempoField, TempoDisabled, Minimal. Interactive stories exercise both renderers
  through `[withRenderer, withMusicScope, withLibraryTheme]`.

## Checks and limitations

- `npx vitest run src/library/Music/music/Transport.lifecycle.test.ts`: **passed**, two lifecycle
  tests (preference restoration/update, blocked storage, nested-row exclusion and cleanup).
- Both local Svelte bindings compiled directly with `svelte/compiler` (`generate: 'client'`),
  **zero warnings**.
- `npm run typecheck`: **passed** on the final run (the earlier unrelated MixerView error was
  resolved by its owning lane).
- Integrated browser rerun, 2026-10-29:
  `node scripts/music-stories.mjs --prefix music-transport --renderer both --output .shots/music-transport-fix`
  **20/20 passed**, zero failures/flaky/HMR recoveries. Interaction plays passed in **both React
  and Svelte** for Default, ClockToggle, Disabled, FullRow, Harness, Mixer, TempoDisabled and
  TempoField (16 runs). Minimal and Playing passed render-only in both renderers (4 runs).
  Report: `.shots/music-transport-fix/stories-2026-10-29T21-24-01-952Z.json`.
- The earlier Svelte Default failure was real stale story-host state: its drawing depended on
  the subscription but its handler expression did not. Both harness bindings now pass the same
  subscribed value to the shared handler model, so Pause requests `false` after Play.
- The earlier React TempoField console error came from Storybook's synchronous event wrapper
  dropping the `act` thenable when committing both editor and host updates. The story explicitly
  awaits the complete commit in `act`; keyboard events, callback/value assertions and production
  control behaviour are unchanged. No console suppression or weakened assertions.
- `npm run typecheck` passed again after those fixes. No unit tests or broad suites were run
  for this QA follow-up. No visual/reference pixel comparison is claimed by this lane.
- No build run by this lane; lead owns final Storybook/library builds and browser evidence.
  No new model/helper/snapshot tests or broad suites are added or run.
