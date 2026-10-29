# Omarchy plugin framework — first vertical slice

Goal: one obvious way to build an Omarchy plugin. Design and exercise its UI in
Storybook without running Omarchy, then use the same view module in Quickshell.
This is a new, small vocabulary, not the Claude Code kit or the music library.

## Current state

**Interactive fixture preview, not a production migration.** Patchy's existing
Mixer.qml, controller, service, manifest, and Python backends are untouched.
Plugin-specific code stays in `patchy/preview/`; Zen owns only the generic kit,
browser binding, native binding, runner and lab.

```
src/harness/omarchy/
  kit/ui.mjs          portable data-only view constructors
  kit/ui.d.mts        TypeScript contract for browser consumers
  kit/Tree.qml        native Qt Quick Controls binding
  kit/lab.mjs         shared lab state/view (no React)
  bench/Preview.tsx   browser binding and Storybook mount
  stories/           lab stories, Controls interaction play
scripts/omarchy-preview.py  isolated native runner, no install/system effects
```

The kit is self-contained. A view is plain data: `kind`, properties, children,
and named actions with serializable payloads. Hosts dispatch `(action, payload,
value)`. Services and process execution do not belong in either renderer.
Do not use the fixture reducer as a production controller: live actions must
wait for authoritative backend snapshots and retain Patchy's identity checks.

## Preview Patchy now

From a Zen checkout with dependencies installed, choose two unused ports:

```sh
OMARCHY_PLUGIN_SOURCE=/absolute/path/to/patchy \
PREVIEW_LABEL="Omarchy / Patchy" PREVIEW_PORT=4192 STORYBOOK_PORT=6023 npm run dev
```

Open `http://127.0.0.1:6023/?path=/story/omarchy-plugins-patchy--quick`.
The plugin story source may import the local framework using `@omarchy/…`;
this is a development alias, not a published runtime API. External stories
are opt-in and are not included in a normal Zen build.

```sh
# Native lab, or Patchy with synthetic fixture data; neither changes audio.
python scripts/omarchy-preview.py
python scripts/omarchy-preview.py --plugin /absolute/path/to/patchy --tab levels

# Real Qt render pipeline, without opening windows in the live desktop.
python scripts/omarchy-preview.py --smoke --screenshot /tmp/opencode/lab.png
python scripts/omarchy-preview.py --plugin /absolute/path/to/patchy --smoke

npm run typecheck
npx tsx scripts/omarchy-typecheck.ts /absolute/path/to/patchy
npx vitest run src/harness
OMARCHY_PLUGIN_SOURCE=/absolute/path/to/patchy npm run build:storybook
```

The native runner copies source to an isolated temporary directory and resolves
the development import there. It does not install, symlink, restart, or modify
the running Omarchy shell. Quickshell/Qt is required only for the native check.

## Lab observations (local Qt/Quickshell, October 2026)

| Probe | Browser | Native | Verdict |
|---|---|---|---|
| Data-only ES-module view | Draws | Draws | Shared module works without a transpiler in Qt |
| Object spread in JS | Works | Parse error | Use `Object.assign` in portable modules |
| Named button/slider/toggle/select/input actions | Browser interactions checked | Native control signals checked in smoke | Supported foundation; not full physical-input coverage |
| Text input redraw | Keyed React tree retains field | Initially destroyed/recreated fields | Native delegates now retained while child count is unchanged; smoke checks object identity and focus |
| Plain text containing HTML | Literal text | Literal text | Explicit `Text.PlainText` required natively |
| Long labels and narrow rows | Browser wraps | Qt RowLayout does not flex-wrap | Not pixel/layout parity; native narrow-layout work remains |
| Theme, controls, separators | Browser approximation | Default Qt controls with injected text colours | Not visual parity; map to Omarchy Commons/Ui before shipping |
| Patchy Quick/Levels/Routing/ALSA fixtures | All render | All render | Preview proof, not feature-complete migration |

Browser checks also exercised default selection, cascade toggle, volume, mute,
route creation, disconnect cancel/confirm, hardware-value validation, and a
390px viewport without horizontal overflow. Browser screenshots were inspected.
Native smoke uses actual Qt objects/signals and offscreen rendering; it is not
evidence for pointer hit testing, popup positioning, Wayland or screen readers.

## Before switching Patchy's entry point

- Match the installed Commons/Style/Ui tokens and controls; don't grow a second
  independent theme system. Current light/Tokyo preview colours are approximations.
- Preserve channel-group selection (including multi-output devices), every
  existing keyboard/cursor shortcut, modal focus, backend lifecycle and error states.
- Connect actions to the current Controller protocol, keeping serial/signature
  safety checks and requiring explicit confirmation for destructive operations.
- Finish keyed native list reconciliation; index retention is only a first pass.
- Verify native narrow layout, popup lifecycle, scrolling, tab order and drag
  semantics. Browser and native sliders currently emit continuously; production
  volume changes need Patchy's release/commit semantics.
- Establish scaffold/build/install rails only after this vertical slice is sound.

Do not silently fall back for unsupported element kinds or call visual parity
done because a build passes. Extend the lab first, then the two bindings.
