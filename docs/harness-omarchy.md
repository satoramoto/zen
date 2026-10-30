# Omarchy plugin framework

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
