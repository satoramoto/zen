# Tasks

## 1. The transport

- [x] 1.1 `Music.Transport`: `unit`/`onUnit`, `onLoop`, `loop.label`, optional `tempo.param`, forms; exports in `music/index.ts`
- [x] 1.2 Stories and plays: Compact, HostUnit, LoopAsData, both renderers

## 2. Retire

- [x] 2.1 Show draws `MusicTransport` in a `MusicScope`; MixBand draws `MusicMeter` in one
- [x] 2.2 Delete `TransportBar` and `LevelMeter`, their registry, snapshot and entry lines, and the root exports
- [x] 2.3 `tiers.baseline.json` drops their keys; `AGENTS.md`, `docs/music.md`, `docs/structure.md`

## 3. Verify

- [x] 3.1 `npm run typecheck`, `npm test`, `npm run build:storybook`, `npm run build:lib`, `npm run check:lib`, `npm run build`
- [x] 3.2 Plays of the transport, meter, MixBand, Show and Workspace stories; MixBand and Show in a browser
- [x] 3.3 `openspec validate retire-music-duplicates --strict`

**Review:** `look`.
