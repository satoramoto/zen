# Music: the reference-faithful instrument toolkit

`src/library/Music/` is the new high-level music family. It ports the controlled mix[flow]
face and its controls from `openflowfm/widgets` at
`7edeedc37e5e4a33315d98ddb93a5a21d6e68eb8`, without redesigning them. The original
`src/library/components/music/` and its public exports remain unchanged. Consolidation is a
separate task, not part of this port.

**Next gap: Arrange.** The arranging/timeline view is not part of this mixer delivery.
See [the next-agent handoff](music-arrange-handoff.md) for source locations, scope questions,
implementation boundaries and fidelity requirements.

## Consume it

```tsx
import { Music, ThemeScope, resolveTheme } from '@satoramoto/zen';
import '@satoramoto/zen/zen.css';

const { facets } = resolveTheme({ theme: 'mixflow' });

<ThemeScope facets={facets} mode="dark">
  <Music.Scope>
    <Music.Knob name="Level" param={levelParam} value={level} onChange={setLevel} />
  </Music.Scope>
</ThemeScope>
```

For Svelte, import `Music` and `ThemeScope` from `@satoramoto/zen/svelte` instead. The
controls use the same framework-free view trees, input stores, and CSS; their children and
face slots are Svelte snippets rather than React nodes.

`Music.Scope` only scopes reference variable aliases. It does not select, persist or override
a theme. `Music.MixerView` includes that CSS boundary itself. Every existing Zen pack and facet
can dress the family. **The mixflow pack is the fidelity contract**: source typography, density,
colours, geometry, materials, layout and interaction states must not be casually changed.

The mixflow scale keeps general Zen UI at the existing compact density/target envelope and
stores its source-faithful density in `scale.instrument` (22px controls, 2px spacing and the
8–20px source type ladder). The same facet emits both vocabularies; Music reads
`--instrument-control-h`, `--instrument-space-*` and `--instrument-size-*`. Other scales
inherit their ordinary metrics unless explicitly overridden. The existing editor's
**Instrument density** group edits these roles without shrinking unrelated app controls.

## Parts and ownership

- `controls/`: shared action faces, toggles, segmented/select menus, popups, parameter knobs,
  numeric fields, vertical/horizontal sliders (`Fader` aliases `Slider`), and labels.
- `param/`, `gesture/`: parameter definitions/formatting, controlled input, pending readback,
  and lifecycle stores. No playback policy.
- `music/`: meters, measured-data canvas waveforms and the transport row.
- `mixer/`: deck and master sections, focused waveform interaction, frame-bound readings,
  and the complete four-deck `MixerView`.
- `theme/`: helpers for active Zen scope colours and importing saved widgets themes as Zen
  skins. No alternate ThemeRoot or palette persistence.
- `stories/`: the silent simulation and fixture adapter. These are dev-only, never exported
  from the production library.

The host still supplies `state`, semantic `commands`, `params`, a read-only `readFrame`, and
ID-to-colour mappings. `Music.musicMixerTheme(state.decks.map(d => d.id))` supplies colour
mappings that follow the active CSS scope. The widget never schedules audio, advances the
engine's clock, quantizes launches, elects a Sync leader, analyzes audio or stores a library.
Absent queued intent (`undefined`) and a queued stop (`null`) remain distinct.

Frame stores update only their own meters, playheads, markers and scrolling strips. They
cancel on unmount and take replacement samplers without turning rendering into a clock.
Canvas palette changes schedule a repaint, even while paused, without reanalysis or remounting
playback.

## Storybook catalog

The Music sidebar is grouped by use, not by implementation folders:

- **Mixer**: the full four-deck mixer, deck strip, master strip, transport and wave controls.
- **Controls**: knobs, faders, number fields, buttons, toggles, hold buttons, segmented controls and selects.
- **Displays**: meters and waveforms.
- **Overlays**: context panels and popups.
- **Themes**: the existing theme editor with live Music specimens.
- **Foundations**: button faces, labels and technical frame bindings.

Each component sits directly inside its category, with variants beneath it. The full mixer
opens with **Default**, followed by **Interactive** and the fixed reference/host-state examples.
Story metas retain their original explicit IDs so bookmarks, browser scripts and comparison
links survive sidebar renames. The implementation paths and public APIs are unchanged.

## Browser evidence

Isolated component stories use an intrinsic-height, softly framed specimen with bounded local
scrolling for larger examples. They never turn the theme scope into a viewport-height slab or
push the Storybook Controls panel away. Fullscreen mixer/reference stories keep their original
layout; specimen framing lives only in `Music/preview.css`, not the shipped component CSS.

The shared port worktree uses the unified launcher with unique ports:

```sh
PREVIEW_LABEL="Zen Music" PREVIEW_PORT=4192 STORYBOOK_PORT=6023 npm run dev
```

The original widgets Storybook is the before reference (`PORT=6024 npm run dev` in widgets).
It is not a production dependency of Zen. `Music/Mixer/Four-deck mixer/Default` preserves the
original paused simulation without an automatic interaction play. Its `Reference` story uses
the same fixed input with either renderer; additional stories exercise interaction and host
states. Do not change reference data or add a redesign to make a screenshot test pass.

```sh
node scripts/music-visual.mjs --reference-only
node scripts/music-visual.mjs
node scripts/music-stories.mjs
```

The corresponding shortcuts are `npm run test:music:stories`, `npm run test:music:visual`,
and `npm run test:music:hooks` (only Music's hook/binding lifecycle tests).
`npm run test:music:themes` exercises every pack/facet through the running development
Storybook toolbar: an edited selection and the mounted mixer/canvas must survive each swap,
and material swaps must change actual face paint, not just a picker value.

The visual script uses Chromium, one device pixel per CSS pixel, dark mode, reduced motion,
and 1440×900, 1280×720 and 900×700 windows. It saves screenshots, exact pixel differences and
layout measurements in ignored `.shots/music/`; any nonzero difference is reported as a
failure, not hidden behind a loose tolerance. `MUSIC_REFERENCE_URL`, `MUSIC_PREVIEW_URL`,
`MUSIC_STORY_ID` and `MUSIC_ARTIFACTS` override its inputs/output. Install the browser once
with `npx playwright install chromium`.

`MUSIC_RENDERER=svelte MUSIC_TARGET_STORY_ID=music-four-deck-mixer--reference` compares
the Svelte fixed fixture against the original React story. `MUSIC_VISUAL_STATE=wave-settings`
or `fx-menu` compares the same story with its waveform-settings popup or FX selector open.
Use a separate `MUSIC_ARTIFACTS` directory for each comparison to retain all evidence.

UI behaviour belongs in story plays, exercised in real browsers. Only input/frame/preview
hook lifecycle tests run separately. No helper/model/tree-snapshot unit suites are added for
this migration. Typecheck, Storybook/library builds and `check:lib` still apply, but do not
establish visual parity. See `docs/music-layout-reference.md` for source anatomy and the
important difference between the standalone story and mix[flow]'s app-only Play host layout.

## Verified port checkpoint (2026-10-29)

- **Zero differing pixels** against the original at 1440×900, 1280×720 and 900×700:
  React and Svelte opening fixtures, open FX menu, and open waveform-settings popup.
- Both **built public renderer entries** (`lib/index.js` and `lib/svelte.js`) plus the built
  `zen.css` also match the original at all three sizes; evidence is in ignored
  `.shots/music-built-compare/` and `.shots/music-built-svelte-compare/`.
- **258/258 browser checks** across 132 Music stories: 203 plays and 55 render-only checks.
  React-only harnesses are reported explicitly, not counted as Svelte coverage. See
  `docs/music-story-evidence.md` for exact reports, HMR recoveries and development history.
- **27/27 hook/binding lifecycle checks**; **39 live pack/facet swaps** retain the edited
  selection and the mounted mixer/canvas. Hardware/panel material swaps change real face
  paint and shadows. Paused skin/colour edits repaint canvas without remounting it; ordinary
  frame transforms do not repaint the cached waveform.
- Original Zen Knob, Fader, Meter and Yahaha Show samples remain **pixel-identical** in both
  renderers to the original checkout (`.shots/music-legacy/report.json`). No legacy
  `components/music/` source was changed.
- Typecheck, library/Storybook builds, framework-free entry checks and whitespace checks pass.
  General unit suites were not run.
