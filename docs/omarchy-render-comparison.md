# Omarchy render A/B — 2026-10-29

## Verdict

**The shared view contract works. Visual parity does not.** The browser is
currently useful for composition and fixtures, but not a trustworthy native
layout/style predictor. Do not migrate the live plugin based on this preview.

The native side here is the framework's current `Tree.qml` in real Quickshell,
using generic Qt Quick Controls. It is **not** the installed Omarchy `Ui` kit
and is **not** a capture of the old/live Patchy Mixer.qml. That distinction is
why this experiment must precede claiming Omarchy parity.

## Method

- 10 capture pairs: lab, Patchy Quick/Levels/Routing/Hardware, each at 850×850
  and 390×850. Device-pixel ratio 1.
- Untouched initial fixtures in both runtimes. Separate lab Baseline story:
  the Controls story has a play function that would otherwise change its state.
- Chromium captures only the plugin panel, not Storybook or desktop framing.
  The panel is constrained to the native window dimensions and can scroll.
- Qt captures the entire background-backed native panel, not a transparent
  content crop. Uses `QT_QPA_PLATFORM=offscreen`, software rendering.
- Capture command asserts identical serialized view trees, panel dimensions,
  semantic element identities and occurrence counts. Every pair passes those
  checks. This verifies comparison inputs, **not render fidelity**.
- Both sides emit element rectangles. Compare matching element occurrences to
  measure x/y/width/height drift; save raw diff and 50/50 overlay PNGs.
- MAE is average per-channel pixel error; mostly-identical backgrounds dilute
  it. It is not an acceptance threshold and must not be called a pass rate.

## Observed failures

| Feature | Evidence | Why it matters |
|---|---|---|
| Row packing | Quick's Advanced button is ~385px farther right natively at 850px | Qt RowLayout distributes spare space differently from CSS flex |
| Narrow advanced tabs | Routing/Hardware Advanced starts at x=372 with width=86 in a 390px panel | Actual offscreen control; browser wraps it to another line |
| Button sizing | Native buttons 7.5px shorter; arrow buttons ~50px wider | Density, targets and neighbouring text widths differ |
| Vertical rhythm | Lab footer ~58px higher natively; Levels footer ~72.5px higher at 850px | Leading, section padding and control heights accumulate |
| Narrow padding | Native uses 20px while browser's responsive padding is 12px plus border | Same outer panel size still yields different content widths |
| Structure | Browser section hairlines and panel border are absent natively | Preview promises visual structure native doesn't provide |
| Controls | Native gradients, blue slider fill, square knobs and Qt checkboxes vs browser styling | Generic Qt is the wrong visual reference for Omarchy |
| Text | Wrapping and line box heights differ, even with the same font family | Long labels and narrow layouts need explicit contracts |

No elements are missing from the **view data**. Two narrow cases have controls
outside the visible window. Merely asserting node counts would have missed that.

## Per-scene measurements

Normalized pixel MAE below is descriptive only. Lower is not necessarily better:
Hardware has less content and more shared empty background.

| Scene | Width | Elements | Native horizontal overflow | Normalized MAE |
|---|---:|---:|---:|---:|
| Lab | 850 | 15 | 0 | 0.02539 |
| Lab | 390 | 15 | 0 | 0.03191 |
| Quick | 850 | 35 | 0 | 0.02750 |
| Quick | 390 | 35 | 0 | 0.05120 |
| Levels | 850 | 33 | 0 | 0.03089 |
| Levels | 390 | 33 | 0 | 0.04444 |
| Routing | 850 | 22 | 0 | 0.03031 |
| Routing | 390 | 22 | 1 | 0.04607 |
| Hardware | 850 | 19 | 0 | 0.01126 |
| Hardware | 390 | 19 | 1 | 0.02249 |

## Next correction pass

1. Use the actual Omarchy `Ui` primitives as native reference, not Qt defaults.
   Read existing Button, PanelSlider, Dropdown, TextField, Toggle and Style
   rather than inventing another control implementation.
2. Define the layout contract explicitly: row packing/wrapping, growth,
   min-width, padding and line-height. Fix the offscreen tabs first.
3. Reflect native tokens and controls in the browser; don't arbitrarily make
   Omarchy look like browser defaults. Rerun this matrix after each change.
4. Extend the lab to hover/focus, open dropdowns, modal editor/confirmation,
   scrolling and slider drag/release. Add loading/error states to native A/B.
5. Only then wire Patchy's live controller, preserving all existing behaviours.

## Reproduce and inspect

Start the unified launcher with Patchy's external stories as described in
`harness-omarchy.md`. Capture tooling additionally needs Playwright, system
Chromium and ImageMagick. An isolated optional Playwright install avoids changing
Zen's dependency graph:

```sh
npm install --prefix /tmp/opencode/omarchy-browser --no-save playwright
PLAYWRIGHT_MODULE=/tmp/opencode/omarchy-browser/node_modules/playwright/index.mjs \
  node scripts/omarchy-compare.mjs /absolute/path/to/patchy
```

`STORYBOOK_URL` and `CHROMIUM_PATH` override their local defaults.

Open **Omarchy → Lab → Render comparison → Captured**. Choose any scene and
side-by-side, overlay or pixel-difference view. Fit-to-width and 1:1 modes are
available. The geometry table exposes native-minus-browser rectangle deltas.

Artifacts live in ignored `.shots/omarchy-ab/`: per-scene browser/native PNGs,
overlay/difference PNGs, input trees, element rectangles, and `report.json`.
Fresh checkouts show instructions instead of fabricated capture evidence.
