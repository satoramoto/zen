# Omarchy render A/B

## Current result

The migrated native plugin and browser share the view **and layout**, with real
Omarchy Ui primitives on the native side. The current capture matrix verifies:

- Identical serialized view inputs and semantic elements.
- **Zero x/y/width/height drift** for every measured node.
- No horizontally offscreen controls at 850px or 390px.
- Identical bounds for the actual open Qt dropdown and its browser counterpart.
- Visually reviewed text, spacing, section rules, fields, switches, sliders,
  selected/disabled controls, dialogs and popup lists.

This is layout/appearance parity for the captured contract, not byte-identical
pixels. Qt and Chromium still differ in glyph antialiasing, border rasterization
and tiny control-glyph details. Raw MAE is retained as evidence, not described as
a pass rate. The comparison tool fails on any geometry drift or horizontal
overflow, even if most pixels happen to be empty background.

## Matrix

17 capture pairs:

- Lab at 850×850 and 390×850.
- Patchy Quick, Levels, Routing and Hardware at both widths.
- Empty, loading, error, hardware editor, disconnect confirmation.
- Open sample-rate dropdown, including the real Qt popup overlay.
- Quick using the current system palette/font snapshot, not just the fixed
  preview palette.

Patchy captures instantiate its actual manifest entry, `Panel.qml`, with a fake
controller. The default scenes use a fixed palette but read current Commons
control state, font and shape tokens; the browser receives that exact snapshot.
The system-theme scene also follows the active native palette/body type scale.
The real installed Wayland window was separately opened and inspected with live
read-only data. No live rate, buffer, gain or routing mutations were used as tests.

## What changed since the initial failed A/B

| Initial defect | Correction |
|---|---|
| Qt tabs spread across the row | One shared packing/wrapping algorithm |
| Advanced clipped offscreen at 390px | Same wrapped rectangles in both engines |
| Different control heights and cumulative vertical drift | Shared integer sizes, line boxes and text breaks |
| Generic Qt controls vs browser mockups | Actual Omarchy Ui.Button/PanelSlider/ToggleSwitch/Dropdown/TextField |
| Missing native separators / panel border | Explicit structural primitives in both bindings |
| Style/selection/font mismatch | Serializable snapshot of actual Commons style roles |
| Browser-only platform select popup | Themed DOM listbox mirroring Omarchy dropdown geometry/navigation |
| Native screenshot silently omitted dropdown | Temporarily capture the real Qt overlay with the QML surface, then restore it |
| Transparent native PNG border compared to opaque browser window | Composite native item alpha over its actual QQuickWindow background |
| Field focus lost on redraw; device reorder could replace controls | Keyed native reconciliation, with a real-host identity/drag test |
| Browser slider wrote throughout drag | Commit only on release/keyboard completion, matching native behaviour |

The original baseline had ~385px horizontal tab drift, 7.5px control-height
differences, >70px accumulated vertical drift and offscreen Advanced controls in
two narrow scenes. Those are now hard assertion failures in the capture command.

## Inspect/reproduce

Start the unified launcher with Patchy's external stories as described in
`harness-omarchy.md`. Capture tooling also needs Playwright, system Chromium and
ImageMagick. Keep the optional Playwright install outside Zen's dependencies:

```sh
npm install --prefix /tmp/opencode/omarchy-browser --no-save playwright
PLAYWRIGHT_MODULE=/tmp/opencode/omarchy-browser/node_modules/playwright/index.mjs \
  node scripts/omarchy-compare.mjs /absolute/path/to/patchy
```

`STORYBOOK_URL` and `CHROMIUM_PATH` override defaults. Refresh the viewer after
capture generation. Avoid running interactive browser tests concurrently with
capture generation: Storybook HMR can reinitialize stories while tests navigate.

Open **Omarchy → Lab → Render comparison → Captured** for side-by-side, overlay,
pixel differences and measured geometry. Fit-to-width and 1:1 modes are available.

Artifacts are ignored `.shots/omarchy-ab/`: actual browser/native PNGs,
overlay/difference PNGs, exact input trees, theme snapshots, popup/element
rectangles and `report.json`. A fresh checkout without captures shows directions,
not fabricated evidence.

## Limits

Offscreen software Qt and Chromium at DPR 1 are the repeatable visual bench.
This does not prove every compositor scale, font fallback, custom per-edge theme
border, Qt version or accessibility path. Wayland placement, physical pointer
interaction, audio-hardware renegotiation and end-to-end latency are separate
checks. Reported PipeWire clock metadata is not a measured ALSA device buffer or
end-to-end latency reading.
