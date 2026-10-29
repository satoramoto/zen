# Music story browser evidence

## Merge follow-up: dense scale compatibility (2026-10-29)

Full CI exposed existing Yahaha layout failures when mixflow's source density was applied to
general Zen controls. The same scale facet now carries compact general metrics plus explicit
instrument density roles. Generic tab padding/assembly target floors remain compatible;
Music retains its exact 22px/2px/source-type anatomy. No existing test assertions were changed.

- Latest browser regression: **258/258 passed**, 132 stories; no failures, flakiness or HMR
  recoveries. Report: `.shots/music-catalog/density-regression/stories-2026-10-29T23-25-47-282Z.json`.
- `LiveEditor` now also resizes an actual Music control through Instrument density while
  preserving general control height, canvas identity, and the edited skin JSON round-trip.
- The previously failing Yahaha suites plus token/skin/tier/Music lifecycle checks pass
  **476/476** locally. Both renderer baselines still match the source at all three sizes with
  zero differing pixels; all 39 live facet swaps pass. Library/Storybook builds and `check:lib`
  pass. The full required CI suite is re-run on the follow-up commit.

## Current full verification — 2026-10-29

**258/258 renderer runs passed across all 132 indexed Music stories**, with **0 persistent failures, 0 flaky runs and 3 explicit HMR recoveries**. This supersedes the historical failures retained below.

```sh
node scripts/music-stories.mjs --workers 4 --renderer both
```

The command exited **0**, using the normal running Storybook/registries on port 6023, `theme:mixflow;mode:dark`, and fresh independent browser contexts. Run window: **21:31:25–21:33:21 UTC**. Full evidence: `.shots/music/stories-2026-10-29T21-31-25-407Z.json` (also `stories-latest.json` at completion).

| Coverage | Passed | Total |
| --- | ---: | ---: |
| Actual story plays | 203 | 203 |
| Render-only checks | 55 | 55 |
| All renderer runs | **258** | **258** |

**255 runs were clean on their first attempt**. Three required a second, clean attempt after the same observed Vite project-annotations HMR update (261 attempts total):

| Story / renderer | First attempt | Fresh-context retry |
| --- | --- | --- |
| `music-waveform--cached-color-scrolling` / React | Recorded failure: `Final phase is playing, not finished`. The original play finished, then HMR began a new render/play before the post-finish check. No play exception occurred. | Finished and passed, no HMR or errors. |
| `music-waveform--colors` / Svelte | HMR-interrupted render-only attempt; no exception or console/page error. | Finished and passed, no HMR or errors. |
| `music-waveform--default` / Svelte | HMR-interrupted play attempt; no exception or console/page error. | Finished and passed, no HMR or errors. |

The original attempts and their phases/errors remain in the JSON; the HMR recoveries are not counted as clean first attempts. All other stories passed without retry, including **Deck 36/36**, **Master 22/22** and **Transport 20/20**. The historical duplicate-key, command-assertion and unawaited-`act` failures did not recur.

All four new theme stories were **already indexed in this full run** and passed their plays on the first attempt: `music-theme--live-editor`, `music-theme--all-instrument-swatches`, `music-theme--legacy-facet-round-trip`, and `music-theme--material-facet-paint`. The index was checked once after the completion notification: it still contained the same **132 story IDs**, with no additions or removals, so no theme catch-up run was needed.

Six stories are honestly **React-only**, not Svelte coverage: the four editor/theme harnesses above, `music-four-deck-mixer--interactive`, and `music-four-deck-mixer--four-decks`. Every other story ran in both renderers. FourDecks stayed **render-only with no automatic play**, preserving the original screenshot baseline.

### Final mixer-model catch-up

The lead's `MixerView.model.ts` self-cycle guard was written at **21:33:41 UTC**, twenty seconds after the full run ended. Its entire story family was therefore rerun against that final change:

```sh
node scripts/music-stories.mjs --prefix music-four-deck-mixer-- --workers 4 --renderer both
```

**16/16 renderer runs passed** (nine stories; 13 plays and three render-only checks), exit **0**, **0 failures and 0 flaky runs**. Report: `.shots/music/stories-2026-10-29T21-34-20-293Z.json`, run window **21:34:20–21:34:36 UTC**. Twelve passed first attempt; four observed a Vite `full-reload` and passed on their clean fresh-context retries: Svelte EmptyLoadingUnavailable, ExternalTransport and FourToSixStems, plus React Interactive. Those four initial attempts had **no assertion failures, page errors or console errors**; all reload evidence is retained. The four additional HMR recoveries belong to this focused follow-up, not the full run's three recoveries. `stories-latest.json` now points to this focused report.

This lane reran browser story checks only: no component/story edits, server changes, registry overrides or unit suites. Separate live pack/facet and pixel-comparison evidence reported by the lead is not included in these counts.

## Runner

`scripts/music-stories.mjs` runs the **existing browser story plays**, not unit/model/snapshot suites. It requires the shared Storybook to be running already; it never starts or stops a server and never writes component/story source.

## Repeat

```sh
node scripts/music-stories.mjs
node scripts/music-stories.mjs --prefix music-deck--
node scripts/music-stories.mjs --id music-controls-button--default --renderer svelte
node scripts/music-stories.mjs 'Music/Mixer/' --workers 3 --retries 0
node scripts/music-stories.mjs --list
```

Default target: `http://127.0.0.1:6023`. Every iframe receives `theme:mixflow;mode:dark;renderer:react` or `renderer:svelte`, with a 1440×900 viewport, dark colour scheme and reduced motion. The runner fetches `/index.json`, selects `type: story` entries under `Music/`, and excludes docs. It does **not** filter on the index's `play-fn` tag: factory-generated plays are not consistently tagged.

`--id` accepts comma-separated exact IDs; `--prefix` accepts an ID or title prefix. Both are repeatable. Positional arguments are prefixes. Filters are combined as a union; unmatched filters fail rather than silently running nothing. `--help` lists equivalent environment variables and timing options. `MUSIC_ARTIFACTS` / `--output` changes the artifact directory.

Each renderer attempt gets a fresh independent browser context. A story runs in React first, then in Svelte only if its **prepared Storybook parameters** contain `svelte` (a fixture or `treeStory`). A custom React-only harness is listed as such, never counted as Svelte coverage. A Svelte-only rerun discovers metadata in an embedded React iframe with autoplay disabled, then runs only the Svelte play. Discovery is retained separately, not counted as a renderer run.

`FourDecks` remains the original no-play React harness baseline; the runner does not click it. Stories without plays are explicitly counted as **render-only**, not interaction tests. The separate `scripts/music-visual.mjs` comparison owns screenshot fidelity to the original on port 6024; this runner makes no pixel/layout-fidelity claim.

## Completion and errors

The observer attaches when `__STORYBOOK_ADDONS_CHANNEL__` is created, **before** navigation can miss fast events. It records channel render phases and exceptions, and checks the corresponding `__STORYBOOK_PREVIEW__.storyRenders` entry. Success requires final `finished`, a `storyFinished` event, and, where a play exists, the `played` phase. This waits beyond rendering and includes Storybook's `afterEach` reporting. A short post-finish interval captures immediate lifecycle errors.

Neither a visible canvas, `storyRendered`, `completed`, nor `storyFinished.status: success` alone is a pass. During development, Deck Empty emitted `storyThrewException` for a Svelte duplicate key and subsequently reported `finished` / `success`. The runner correctly rejected that attempt.

Failures include any errored phase, Storybook render/play/config/missing-story exceptions, unsuccessful finish reporting, page errors, unhandled rejections, console errors, failed network requests (apart from retained navigation cancellations), visible Storybook/Vite error overlays, missing play completion, incorrect globals, or a newly introduced play on the FourDecks baseline. Full details, event chronology and render metadata are retained in JSON; failed attempts also get a viewport screenshot.

Vite WebSocket updates/reloads/errors and Storybook hot-update/index-invalidated events identify HMR-affected attempts. The default is one fresh-context retry after a one-second delay; that delay does not guarantee the whole shared source tree is frozen. A clean retry after observed HMR is reported separately as `pass-after-hmr`; a clean retry after an ordinary failure is `flaky` and still exits nonzero. Persistent failures remain failures. All attempts survive in the report, so a retry never erases the original error.

## Artifacts

Ignored `.shots/music/` holds:

- `stories-<UTC timestamp>.json`: immutable run report, including selection, globals, exact counts, renderer support, every attempt, errors and channel phases.
- `stories-latest.json`: the most recently completed report.
- `<timestamp>-<story-id>-<renderer>-<attempt>.png`: failed-attempt viewport screenshots.

Stdout gives one concise result per renderer, explicit React-only exclusions and the report path. Exit status is nonzero for failed/flaky runs or unknown renderer support. No assertion is added to production components by this runner.

## Historical development runs

Initial observer smoke check, 2026-10-29, `--retries 0`:

- Button Default: React and Svelte plays passed.
- Deck Empty: React play completed, but duplicate-key console errors failed the run; Svelte render threw `each_key_duplicate` (`k:drums`, indexes 3 and 15).
- FourDecks: correctly classified React-only/render-only; duplicate-key console errors failed its render check. Its baseline was not interacted with.
- Total: **2/5 renderer runs passed**, 3 failed; 4 play-bearing runs and 1 render-only run.
- Report: `.shots/music/stories-2026-10-29T21-16-38-416Z.json`.

### First complete run

2026-10-29, `node scripts/music-stories.mjs --workers 3`, report `.shots/music/stories-2026-10-29T21-16-50-573Z.json`:

| Coverage | Passed | Total |
| --- | ---: | ---: |
| Play-bearing renderer runs | 167 | 195 |
| Render-only runs | 53 | 55 |
| All renderer runs | **220** | **250** |

All **126 indexed Music stories** were selected. The index still contained the same 126 IDs after completion. Exactly two stories were React-only: `music-four-deck-mixer--four-decks` (render-only) and `music-four-deck-mixer--interactive` (play). Both passed; neither was counted as Svelte coverage. All other stories ran in both renderers.

The command exited **1**: **29 failures, 1 flaky run**, and **8 HMR-affected runs recovered on a clean retry**. The 220 passes include those eight explicit recoveries. The flaky run was Svelte Deck Loop In Pending: duplicate-key failure followed by a clean retry, with no observed HMR in that attempt; it was conservatively kept non-passing.

Findings at the time of this development-state run:

| Story ID suffix / prefix | Renderer | Error |
| --- | --- | --- |
| `music-deck--{all-stops-queued,channel-controls,default,empty,full-mix,full-stop-queued,launching-and-stopping,loading}` | Both | React duplicate-key console errors (`k:drums`, also bass/other/vocals); Svelte `each_key_duplicate`, `k:drums`, indexes 3/15. |
| `music-deck--loop-in-pending` | React failed; Svelte flaky | Same duplicate-key issue. The deck owner changed the source during this run; later Deck stories passed. |
| `music-master--effects-and-phones` | Both | Expected last `setEffectsEnabled` call with `[false]`. |
| `music-master--fx-selection` | Both | Expected last `setEffect` call with `['A', 'reverb']`. |
| `music-master--host-callbacks` | Both | Expected last `setMaster` call with `['bpm', 160]`. |
| `music-master--read-only-effects` | Both | Expected last `setEffect` call with `['A', 'reverb']`. |
| `music-master--transport` | Both | Expected last `setRunning` call with `[false]`. |
| `music-transport--default` | Svelte | Expected last `onPlay` call with `[false]` after the Pause keyboard interaction. |
| `music-transport--tempo-field` | React | Play reached `played`, but React emitted the unawaited asynchronous `act` console error. |

The five Master assertions and both Transport findings reproduced in two fresh contexts in that run. Some Master attempts observed HMR, but the final failed retries did not. Full assertion stacks and all retry chronology are in the report. This is not a claim that the source stayed frozen while other lanes worked.

These are development-state findings, not final acceptance. Subsequent narrow reruns are recorded below. No unit suites were run in this lane.

### Earlier targeted reruns

| Report under `.shots/music/` | Selection | Result |
| --- | --- | --- |
| `stories-2026-10-29T21-19-58-640Z.json` | All Deck, Master and Transport stories; 39 stories / 78 renderer runs; retries disabled | **62 passed, 16 failed**. Four failures were HMR-only interruptions (React Deck Loading, Loop In Pending, Launching And Stopping; Svelte Master No Effects). No duplicate-key errors remained. The other 12 were the Master/Transport findings above. |
| `stories-2026-10-29T21-20-55-496Z.json` | Those four HMR-only stories, both renderers | **8/8 passed**, including three clean retries after observed HMR. |
| `stories-2026-10-29T21-21-22-715Z.json` | The five failing Master stories plus Transport Default and TempoField, both renderers | **2/14 passed, 12 failed**, exit 1. Every failed run reproduced on its fresh-context retry. **No HMR was observed in any attempt**. React Transport Default and Svelte Transport TempoField passed. |

At this historical checkpoint there were **12 unresolved renderer failures**: ten Master assertion failures (the five named stories in both renderers), Svelte Transport Default's Pause callback assertion, and React Transport TempoField's unawaited-`act` console error. These were reported to the lead; this lane did not alter the components or their plays. All Deck stories had clean coverage across the two narrow reports. Owners subsequently fixed the Master and Transport findings; the current full verification is summarized at the top of this document.

Additional runner checks: `node --check scripts/music-stories.mjs` exited 0; prefix listing selected the four Frames stories and no docs; a Svelte-only Button/FourDecks check passed the Button play, skipped FourDecks as React-only, and confirmed both discovery iframes had autoplay disabled and no `played` phase (`stories-2026-10-29T21-17-38-892Z.json`). No servers, worktrees, commits, global configuration, or unit suites were created/run by this lane.
