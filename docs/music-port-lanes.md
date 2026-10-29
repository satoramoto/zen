# Music: mix[flow] fidelity port

Worktree: `zen-music`, branch `feat/music-port`. All lanes share this worktree; no lane creates a worktree, commits, starts/stops a server, or changes another lane's files. The original `components/music/` stays untouched.

## Contract

- Reference: `/home/ryan/Projects/openflowfm/widgets`, especially `src/mixer/` and its Four-deck mixer story. Preserve appearance, geometry, classes and behaviour; this is not a redesign.
- New implementation: `src/library/Music/`. Mirror the reference's `controls/`, `param/`, `gesture/`, `music/`, `mixer/` structure while converting to Zen's shared view-tree models, plain-TS binding stores, and thin React/Svelte bindings.
- New stories: `Music/…`, using Zen's `withLibraryTheme` and Renderer toolbar. The `mixflow` pack must look like the original; other packs/facets must work without an inner forced theme.
- Keep reference component export names at their local paths (`Button`, `Knob`, `Slider`, `Meter`, `Waveform`, `DeckStrip`, `MasterStrip`, `MixerView`). Central public exports will use `Music…` aliases to avoid disturbing legacy names.
- View-tree component names are prefixed `Music` (e.g. `MusicKnob`). Store names are prefixed `music` (e.g. `musicParamGesture`). Give the lead exact registry entries needed; do not edit central registries.
- All callbacks, including readFrame, in store params are handler keys, adapted through `keyed()` in the central registry. No renderer-specific behaviour or duplicated Svelte DOM implementation.
- Preserve the original `wdg`, `play-*` class anatomy. The lead owns shared `Music/mixer/mixer.css`; lanes do not edit it. Controls own separately named local stylesheets; no unscoped `:root`/`body` palette writes.
- Theme lane owns `Music/theme/` except `spectral.ts` (waveform lane), `Music/base.css`, `Music/theme.css`, and facet/contract changes. Reference variable names can be local aliases to the Zen contract; no hardcoded source palette hidden inside controls.
- Only story interaction/visual tests and narrowly scoped hook/lifecycle tests. Do not add/run model/helper/snapshot unit tests or whole test suites. Typecheck/build are allowed. Report exactly what was actually checked.
- No production imports from the original widgets repository/package. Fixture reference imports can be browser-test-only, arranged by the lead.

## Ownership

1. Theme: contract/facets/mixflow pack, scoped token aliases, font assets, legacy-theme adapter.
2. Pressables: `Music/controls/{Button*,ButtonFace*,Toggle*,Segmented*,Select*,Popup*,Label*,pressables.css}`, `Music/mixer/{Momentary*,ContextControls*}`.
3. Parameters: `Music/{param,gesture}/`, `Music/controls/{Knob*,NumberField*,Slider*,Widget*,arc.ts,fill.ts,reserve.ts,pointing*,wake*,hint*,parameters.css}`. Own shared parameter gestures for all continuous controls.
4. Waveforms: `Music/music/{Waveform*,levels*,outline*,spectralOutline*,spectralPainter*}`, `Music/theme/spectral.ts`.
5. Frames/meters: `Music/music/Meter*`, `Music/mixer/{frames*,WaveControls*}`. Preserve isolated frame updates, focused-source interaction and marker behaviour.
6. Deck: `Music/mixer/{DeckStrip*,KnobStack*,Separator*,StemConnections*}`. Keep full source anatomy and command semantics.
7. Master: `Music/mixer/MasterStrip*`. Keep full source anatomy and command semantics.
8. Preview: `Music/mixer/{model.ts,MixerView.fixtures.ts,MixerView.stories.tsx}`, `Music/stories/`. First write the host model so other lanes can compile against it; preserve preview fixture and controlled-clock behaviour.
9. Lead: integration, `MixerView` bindings/models, shared mixer CSS, component/store registries, public exports, docs, browser evidence and final typecheck/build.

## Preview

Original Zen remains on `6022/4191`. Shared worktree's unified launcher runs Storybook at `http://localhost:6023/` and app at `http://localhost:4192/`. Keep the group alive for hot reload; don't start replacement children independently.
