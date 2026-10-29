# Waveform lane

## Integration (lane 4)

Local mirrors: `music/Waveform.tsx` (`Waveform`, `WaveformProps`), `music/Waveform.svelte`, `music/Waveform.model.ts` (`waveformView`, framework-free props), `music/levels.ts`, `music/outline.ts`, `music/spectralOutline.ts`, and pure `theme/spectral.ts` (including `SpectralEnergy`, presets, painters and validation).

Register the canvas store in `src/library/view/stores.ts`:

```ts
import { bindWaveform, type WaveformParams } from '../Music/music/Waveform.canvas';
// No callbacks in this store: all params are data.
musicWaveform: keyed<WaveformParams, never>(bindWaveform, []),
```

Register `MusicWaveform` in both component registries, pointing to the local React/Svelte bindings. Other lanes can import `Waveform` / `WaveformProps` from `Music/music/Waveform` and `SpectralEnergy` from `Music/theme/spectral` without importing a framework in their models (props also live in `Waveform.model.ts`).

### Theme bridge

The canvas reads computed `--instrument-spectral-{low,mid,high}` (fallback aliases `--spectral-*`), `--instrument-waveform-base`, and `--instrument-idle`; it does not import a theme context. Canonical `--instrument-spectral-mode: deck | spectral` and `--instrument-spectral-strength: 0..100` control paint, falling back to aliases `--music-spectral-mode` / `--music-spectral-strength` only when canonical tokens are absent. Canonical tokens win because an inherited CSS alias can have resolved outside a nested ThemeScope. Optional `--music-spectral-preset: RGB | Prism | Aurora | Ember | Warm | Ice` selects the complete original finish, not just its colours. A complete serialized `SpectralStyle` can instead be supplied as unquoted JSON in `--music-spectral-style` (useful for a legacy theme adapter). Explicit `presentation` still overrides the theme treatment, as in widgets. Original HSL token precision is preserved until the painter's final RGB rounding.

Without a preset/serialized style, spectral colours come from the active Zen scope, with original RGB only as a missing-token fallback. Presets/JSON are explicit overrides. All original treatment fields are preserved. Scope attribute/stylesheet mutations and colour-scheme changes compare computed paint tokens, resolved ink and host colour-variable keys with the last paint **before** scheduling. Transform-only scrolling leaves the cached canvas untouched; actual theme changes coalesce into one repaint. Resize and prop updates still schedule normally. Host colour references are scanned only when their array changes, not on each frame. Geometry/packed peak ladders remain cached on paint-only changes. No remount or audio analysis is needed.

### Checks and evidence

- `npm run typecheck`: passed after final lane edits.
- `npx vitest run src/library/Music/music/Waveform.lifecycle.test.ts`: 3 hook/lifecycle tests passed (coalescing/cleanup, unchanged backing-store reuse, and transform notification filtering with ink/host-colour/theme/resize/prop invalidation). No helper/model/snapshot suites added or run.
- Browser at existing `6023`: all eight specimens rendered in React and Svelte; Default/Empty/Silence/SpectralPaint/ThemeRepaint plays passed, including paused scoped colour/mode/band/preset edits and stable canvas identity/backing size. Captured/reviewed 1000px geometry/spectral specimens and 320px narrow React/Svelte: no horizontal overflow. Initial isolated runs installed the documented store adapter only into browser module instances before the lead's registry integration, without changing production registries.
- Constituent FourDecks comparison against original `6024` at 1280px: all four peak data hashes, dimensions and complete alpha masks match exactly. The reported B/C/D fill differences were theme-lane 8-bit hex rounding before `color-mix`, not geometry. Following the theme precision fix, the normal integrated target page's complete RGBA canvas SHA-256 hashes match the original for **A/B/C/D without any overrides**. No geometry changes or tolerances used.
- Final dual-renderer browser rerun: 26 recorded cases, zero play failures/page errors; canonical instrument mode/strength and fractional HSL band edits repaint while paused. React/Svelte narrow specimens both have `scrollWidth === innerWidth === 320`.
- `Music/Waveform/CachedScrolling` and `CachedColorScrolling` use the real `musicFrameWaveLane` store with a deterministic 1/60-beat clock. Browser instrumentation in **both renderers** recorded 52 changing strip transforms with **0 scrolling clearRect / fill calls**, then **1 clearRect + 1 fill** for a real skin mutation. Host-gradient runs recorded 74 transforms total; their additional non-theme custom colour-variable edit caused exactly one further clear/fill (2 total), with no subsequent drawing during scrolling. Canvas identity, backing dimensions and unchanged scrolling pixels are asserted. All four normal integrated Storybook iframe routes also pass without browser registry overrides; `waveform-performance.json` records their counts and zero page errors. No pure helper unit tests were used.
- Evidence/scripts are under `/run/user/1000/ggg/3ce01bc92a31f243ce1d/tmp/opencode/`: `waveform-fidelity.json`, `waveform-browser-results.json`, `waveform-performance.json`, `waveform-*-live.png`, `waveform-playwright.mjs`, `waveform-performance.mjs`, `waveform-fidelity.mjs`.

### Integration limits

- The lead owns registries, exports and full integrated build/visual checks; this lane did not edit them, commit, create a worktree, or start/stop application servers.
- A legacy adapter can apply its returned complete spectral metadata with `scope.style.setProperty('--music-spectral-style', JSON.stringify(spectral))`; this preserves automatic power-to-RMS treatment, unlike changing only band colours. A caller-supplied `presentation` retains the original explicit-override semantics (no automatic RMS conversion).
- Mutation observation handles normal theme scope attribute/class/style edits and stylesheet DOM edits. CSSOM-only `sheet.insertRule()` / `replaceSync()` edits with no DOM mutation need an accompanying scope attribute/style change; there is deliberately no perpetual repaint loop while paused.
