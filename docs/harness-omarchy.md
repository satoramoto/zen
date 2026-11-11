# Omarchy plugin framework

Two ways to see an Omarchy plugin in Storybook:

- **The stage** (`src/harness/omarchy/stage/`): any plugin, as written, drawn by
  real Qt. It runs the plugin's own QML with Omarchy's installed kit in a
  headless, sandboxed Quickshell. The canvas shows the frames Qt draws, and plays
  and the viewer drive it with real Qt input. Use it for every plugin story.
- **The portable kit** (below): a view vocabulary that one module draws both in
  the browser and natively. It also has a browser copy of Omarchy's controls.

## The stage

```
story ── <OmarchyStage plugin state/> ── HTTP /__omarchy-stage ── Session (Node)
                                                               │
             bwrap: read-only /, no network, own pids, /run/user and /run/dbus hidden
                 dbus-run-session ── quickshell (QT_QPA_PLATFORM=offscreen)
                     shell.qml: screen window, bar strip, PluginBarApi, TestCase
                     staged copy: Omarchy's Commons/Ui/services + the plugin
                     PATH: fakes ─► fake-command.mjs ─► broker socket ─► fixture
```

**Faithful where it counts.**
- The plugin's QML and Omarchy's kit run unmodified, on Qt's software renderer,
  in the person's current theme and fonts. The stage copies the theme files and
  reads Hyprland's rounding and gaps once, read-only.
- Only the window layer is stood in for, because headless Qt can't create
  layer-shell surfaces:
  - In the staged copy, `PanelWindow`, `FloatingWindow` and `PopupWindow` become
    `StagePanelWindow`, `StageFloatingWindow` and `StagePopupWindow`.
  - `WlrLayershell.x:` becomes `wlr_x:`.
  - `item.QsWindow.window` becomes `Stage.windowOf(item)`.

  Omarchy's real KeyboardPanel, PopupCard and OverlayWindow run on those
  stand-ins.
- The widget is hosted like `Bar.qml` hosts one. It gets Omarchy's own
  `PluginBarApi` as `bar`, plus `moduleName`, `settings` and `fixedEdge`.
- Services are created with no visual parent and handed `omarchyPath`, `shell`
  and `manifest`.
- Plugins are staged outside the shell's config root and loaded by `file://`
  URL, as the shell loads `~/.config/omarchy/plugins`. Inside the root,
  Quickshell's `qs:` scheme breaks a plugin's imports of its sibling files.

**Isolated from the machine.** Each session runs in `bwrap`:
- `/` is read-only.
- Only the session folder (`~/.cache/omarchy-stage/sessions/<id>`) and its
  runtime folder (`/tmp/oqs-*`, sockets only) are writable.
- `/tmp` is private.
- `/run/user` and `/run/dbus` are hidden: no Wayland, PipeWire, session bus or
  1Password socket.
- There is no network, and the session has its own pid namespace.
- `dbus-run-session` gives it a private bus.

`PATH` is the session's fakes plus a short list of harmless tools. Every command
that could reach the machine (`GUARDED` in `session.mjs`: hyprctl, omarchy,
wpctl, systemctl, python, op, …) is faked:
- A fixture answers it.
- Or the stage answers it: Omarchy's own `hyprctl getoption` and `notify-send`.
- Or it fails with 127, and the log shows it as unanswered.

An absolute `/usr/bin/x` in the plugin becomes `x`. Quickshell's UPower, PipeWire,
MPRIS, Polkit and Hyprland modules become fakes under `qml/stage/fakes/<Name>/`,
driven by the fixture.

**Sessions end.** A session ends when:
- the story unmounts or its page hides;
- nothing has asked anything of it for 90 seconds;
- the server stops.

Its process group is killed and both folders are removed. `bwrap
--die-with-parent` covers a killed server, and the next server sweeps the folders
it left.

### Using it

In a Storybook's `.storybook/main.ts`:

```ts
import { omarchyStage } from '@satoramoto/zen/harness/omarchy/stage/server.mjs';
config.plugins.push(omarchyStage({ plugins }));   // an object, or a function read per request
```

A registry entry (`PluginEntry` in `server.d.mts`) names the plugin's folder:

```js
'satoramoto.p5a': {
  source: '/path/to/plugin',              // holds manifest.json
  fixture: '/path/to/fixture.mjs',        // default export: (state, session) => Fixture
  prepare(dir, session) { … },            // edit the staged copy (fill placeholders)
  roles: ['barWidget'],                   // entry points to load; all by default
}
```

A story:

```tsx
import { OmarchyStage, stageOf } from '@satoramoto/zen/harness/omarchy/stage/index.ts';
export const Open = {
  args: { plugin: 'satoramoto.p5a', state: { personas: [...] }, width: 620, height: 880 },
  play: async ({ canvasElement }) => {
    const stage = await stageOf(canvasElement);
    await stage.click('p5a');               // exact visible text; '#name' for an objectName
    await stage.waitForText('Personas');
  },
};
```

Component props:
- `plugin` and `state`.
- `roles` and `settings`.
- `width`, `height` and `scale` (device pixels per pixel).
- `theme`: an Omarchy theme by name, or `current`.
- `animations`: off by default, so frames settle at once.

The client (`client.ts`) reads and acts on the screen:

| Call | Does |
|---|---|
| `click(target, {button, at, modifiers, double, timeout})` | moves the pointer there and clicks at the target's centre; waits until it is shown and enabled |
| `type(target, text, {append})` | clicks the field, selects all unless `append`, types key by key |
| `press(key, {modifiers})` | Escape, Enter, Tab, Backtab, Up, Down, …, or a character |
| `hover(target)`, `pointer(kind, x, y, …)`, `key(kind, key)` | raw input |
| `texts()`, `strings()`, `find(target)`, `inspect(target, props)`, `focused()` | what Qt shows |
| `waitForText(match)`, `waitForNoText(match)` | wait for a text, or for it to go |
| `calls(name)`, `waitForCall(name, test)`, `reports(kind)` | what the plugin ran, and what fakes were asked |
| `fixture(op, data)`, `ipc(target, fn, …args)`, `shortcut(name)` | change the world; call the plugin's IPC; press a GlobalShortcut |
| `settle()` | wait until frames stop changing |

A target is:
- exact text;
- `#objectName`;
- or `{ text | textContains | name | placeholder, index, within }`.

Matching is by what is *shown*. Anything invisible, transparent, clipped or off
screen doesn't count. When several things match, the call fails until you give an
`index` or a `within`.

A fixture module (`Fixture` in `session.d.mts`) returns:

| Field | What it gives |
|---|---|
| `commands` | `{ name(call, session) }`, answering `{ stdout, stderr, code, delay }` |
| ↳ `stream` | an answer that writes lines over time |
| ↳ `exec` | runs the real program inside the sandbox; what it prints lands in the call log |
| `services` | the fakes' first state, by service |
| `ops` | for `stage.fixture()` |
| `serviceCall` | hears what a fake was asked to do |
| `overlays` | files laid read-only over the sandbox, such as an `/etc/passwd` |

Push service changes with `session.setServices({ upower: … })`.

Play stage stories with `zen-stories` (`harness-stories.md`), with the Storybook served:

```sh
node src/harness/stories/cli.mjs omarchy-lab-on-qt          # in zen
npx zen-stories --url http://127.0.0.1:6030 omarchy-power   # in a project that uses zen
```

Tag a stories file whose stories run on the stage `stage`. Such a story plays on the
runner's virtual DOM, with no browser: `<OmarchyStage>` starts its session on the served
stage, the play drives it through `stageOf(canvasElement)` as it would in a page, and the
session ends with the story. Where nothing draws, the component fetches no frames and no log;
the play's own calls keep the session alive. Where no stage server answers (a CI runner),
`stage` stories are skipped with the reason. A story about the stage's own page (its frame,
clicking and typing on the canvas) is tagged `stage` and `browser` and plays in Playwright's
headless shell against the served Storybook.

The tools it needs are `quickshell`, `bwrap`, `dbus-run-session` and Omarchy's shell kit, and,
for the stories tagged `browser`, Playwright's own Chromium headless shell, installed once with
`npx playwright install --only-shell chromium`. A story whose plugin or tools are missing shows
why, and its play fails.

**Sessions start four at a time.** Starting Quickshell is the burst of CPU a run makes, so the
server starts no more than four sessions at once, whoever asks: every page and every runner of
every agent goes through it. The rest wait their turn rather than fail. A project sets another
limit with `omarchyStage({ plugins, maxStarting: 2 })`.

## The portable kit

One path from a fixture-driven Storybook UI to a native Omarchy plugin. This is
an Omarchy vocabulary, not a port of Claude Code's inspector or the music kit.

## Architecture

```
plugin state → portable view data → shared integer layout → browser binding
                                                       → native Omarchy Ui binding
plugin actions → pure command model → fixture acknowledgement OR real Controller
```

`src/harness/omarchy/kit/` is self-contained source, copied into a plugin's `zen/`
directory. The only external native imports are Qt/Quickshell and Omarchy's own
`qs.Ui` / `qs.Commons`. No React reaches the native kit.

| File | Responsibility |
|---|---|
| `ui.mjs` | column, row, section, text, button, slider, switch, select, input; stable identities |
| `layout.mjs` | shared packing, wrapping, line breaks and integer rectangles |
| `theme.mjs` | portable theme contract and preview fixtures |
| `Theme.qml` | actual Commons palette, font and interactive-state snapshot |
| `Tree.qml` | real Ui.Button/PanelSlider/ToggleSwitch/Dropdown/TextField, keyed reconciliation |
| `Panel.qml` | window lifecycle, scrolling, keyboard/popup ownership, cursor reveal, capture |
| `bench/Preview.tsx` | browser binding, including themed dropdowns and release-committed sliders |
| `stories/` | controls lab and native/browser comparison viewer |

Views contain serializable properties, children, keys, and named actions with
payloads. A renderer cannot execute processes or mutate audio. A plugin's model
returns a command; its host decides whether to send it to the controller.

Rows wrap deliberately. Text uses explicit line breaks and line boxes in both
engines rather than two independent approximations of flexbox. Monospace type
is part of the contract. Real native controls retain Omarchy's focus, hover,
selection and theme behaviour; browser controls mirror those state tokens.

Native keyed delegates move existing controls when devices reorder, preserving
focus and an in-flight slider's association with its original device.

## Patchy: the first real consumer

The plugin repo owns:

- `Panel.qml`: thin controller/effects host on `Zen.Panel`.
- `Patchy.mjs`: **the same** view and action/command model used by Storybook.
- `Rows.mjs`: domain rows and stable keyboard cursor identities.
- `Controller.qml`, `Service.qml`, Python backend: authoritative live state.
- `preview/`: synthetic snapshots and a mock acknowledgement host, never live commands.
- `tools/build-framework.py`: copies changed kit files; records source provenance.

The manifest points at `Panel.qml` (0.2.0). `Mixer.qml` is a compatibility shim;
`Mixer.legacy.qml` preserves the original implementation for reference/rollback.
No command model is duplicated between native and browser hosts.

Quick includes sample-rate and buffer-size drafts with separate Apply actions.
These target PipeWire **session overrides**, not ALSA hardware buffers, and do
not write on selection, opening, navigation or refresh. Backend validation keeps
metadata identity, type and bounds checks. Automatic writes the corresponding
force override back to zero. Changes can interrupt audio and reset with PipeWire.

## Develop

From Zen, choose two unused ports:

```sh
OMARCHY_PLUGIN_SOURCE=/absolute/path/to/patchy \
PREVIEW_LABEL="Omarchy / Patchy" PREVIEW_PORT=4192 STORYBOOK_PORT=6023 npm run dev
```

Open `http://127.0.0.1:6023/?path=/story/omarchy-plugins-patchy--quick`.
External stories can import `@omarchy/…`, a checkout-only development alias.
They are opt-in, not included in a normal Zen build.

```sh
# Update the native kit (from Patchy).
python tools/build-framework.py --zen /absolute/path/to/zen

# Real plugin host, fake controller, zero audio processes.
python tools/test-framework-native.py

# Generic lab in real Quickshell; native imports need Omarchy installed.
python scripts/omarchy-preview.py --smoke

# Compile browser binding and external story types.
npm run typecheck
npx tsx scripts/omarchy-typecheck.ts /absolute/path/to/patchy
npx vitest run src/harness
OMARCHY_PLUGIN_SOURCE=/absolute/path/to/patchy npm run build:storybook
```

Only browser iteration needs to work outside Omarchy; the final native check
uses the real installed controls. Never modify `/usr/share/omarchy`.

See [the render comparison](omarchy-render-comparison.md) for captures,
reproduction commands, acceptance checks and remaining runtime differences.

## Installing source changes

User plugins hot-reload existing files, but Qt can retain component/directory
caches when adding new QML files or replacing an entry point. In the migration,
rescan alone kept the old UI; one `omarchy restart shell` loaded the new entry.
Do not restart PipeWire or rewrite a person's saved routing preferences.

On this machine Patchy's installed directory is a symlink to its checkout.
The live native window was opened and inspected after migration. Its read-only
diagnostics confirmed the Zen host, seven real nodes, 48,000 Hz / 1,024 frames,
no forced clock overrides, and no backend failure. Mutating commands were
exercised with mocks, **not** against the person's actual audio devices.
