# Music.SeekBar verification

Adds a seconds-based controlled seek surface to both public Music renderer namespaces. It shares the existing parameter gesture store with backwards-compatible opt-in keyboard/cancellation settings. No audio scheduling or playback clock.

Local verification (2026-11-01):
- `npm run typecheck`: exit 0.
- `npm run build:lib`, `npm run check:lib`: exit 0; framework-free entries remain free of React.
- `npm run build:storybook`: exit 0.
- `npx vitest run src/library/Music/gesture/paramGesture.lifecycle.test.ts src/library/tiers.test.ts src/library/library.test.tsx`: 32 tests pass.
- Built Storybook, `node scripts/music-stories.mjs --prefix music-seek-bar --url http://127.0.0.1:6048 --output .shots/seek-reviewed-built --workers 2 --retries 0`: 12/12 pass, React and Svelte, no retries or HMR recovery. Local evidence: `.shots/seek-reviewed-built/stories-2026-11-01T19-44-30-196Z.json`.
- Chromium 390x320 screenshot manually inspected: seek surface 324px wide, approximately 20px tall, no page horizontal overflow. Local screenshot `.shots/seek-reviewed-built/narrow.png`.
- `git diff --check`: exit 0.

Stories cover pointer start/middle/end, host-authoritative readback, external host update during drag, keyboard bounds, Escape/pointer cancellation/capture loss, disabled/invalid duration and clamped out-of-range position. The host-update story uses explicit story-only React/Svelte hosts so Storybook args updates do not restart the Svelte play phase. Earlier failing runner artifacts remain local and are not counted as acceptance.

Not established by these checks: audible scrubbing, native playback or hardware behavior. No claim of full theme-matrix visual acceptance; ordinary theme tokens are reused.
