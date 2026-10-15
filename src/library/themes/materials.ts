import type { Layer, LayerAmbient, LayerInk, LayerName, Material, Materials } from '../contract';

// Materials: shape plus what each part is made of. Every value reads palette variables, so a set
// works with every palette in light and dark.
//
// The four flat sets share one face per role, lifted from the Yahaha widgets as they are drawn
// today; only shape, the base layer (the old Chrome `card`) and the tabs differ between them.
// `hardware` is the skeuomorphic set from Yahaha's pre-minimalism UI (old-ui/app/src/app.css
// material recipes). `frost` is visual[flow] 1.0's glass (openflowfm/visuals, decisions 68–71).
//
// Layers, back to front: ground, base, raised, float, overlay, top (contract.ts `Layer`). Flat sets
// read depth as tone steps (surface-0..3) with hairline edges; hardware as bevels and cast shadows
// that grow with depth; frost as faint tints, with glass only on what floats.

/** No shadow, as a real shadow: `none` is invalid inside a box-shadow list, and components list a
 *  material shadow alongside their own state rings. */
const NO_SHADOW = '0 0 0 0 transparent';

/** A layer with nothing but a fill: opaque (so `solid` is the fill), no texture, blur, cast or edge. */
function plain(fill: string, solid: string = fill): Layer {
  return { fill, solid, texture: 'none', backdrop: 'none', cast: NO_SHADOW, edge: NO_SHADOW };
}

// ── Palette-relative tones ───────────────────────────────────────────────────────────────────────
// The source's literal greys become palette-relative colours (relative colour syntax): `shade` is
// always darker than the ground, `light` always a pale edge, in either mode and on any palette.

/** A dark tone in both modes: the ground at a quarter of its lightness. Replaces rgb(0 0 0 / a). */
function shade(alpha: number): string {
  return `oklch(from var(--surface-0) calc(l * 0.25) c h / ${alpha})`;
}
/** A pale tone in both modes: the top surface lifted towards white. Replaces rgb(255 255 255 / a). */
function light(alpha: number): string {
  return `oklch(from var(--surface-3) calc(0.8 + l * 0.2) c h / ${alpha})`;
}

// ── Flat faces (today's Yahaha widgets) ──────────────────────────────────────────────────────────

/** Fader groove (Fader.css `.yh-fader__groove`). Knob rings and meter channels wear it too. */
const flatWell: Material = {
  fill: 'color-mix(in oklab, var(--border-strong) 70%, transparent)', // Fader.css groove
  shadow: NO_SHADOW, // Fader.css groove
  texture: 'none', // Fader.css groove
};

/** Readout windows sit on the ground (Display.css `.yh-display`). */
const flatScreen: Material = {
  fill: 'var(--surface-0)', // Display.css .yh-display
  shadow: NO_SHADOW, // Display.css .yh-display
  texture: 'none', // Display.css .yh-display
};

/** One key face for pads, buttons and tabs: the pad's grey with the button's inset outline. */
const flatKey: Materials['key'] = {
  fill: 'var(--surface-2)', // Pad.css .yh-pad, LampButton.css
  shadow: NO_SHADOW, // the keys keep their own CSS borders (state edges), so flat adds none
  texture: 'none', // Pad.css, Button.css
  pressed: NO_SHADOW, // Pad.css: pressing moves the face (translateY), not its edge
};

/** Fader cap (Fader.css `.yh-fader__cap`); its centre line stays the component's indicator. */
const flatHandle: Material = {
  fill: 'var(--surface-3)', // Fader.css cap
  shadow: 'inset 0 0 0 max(1px, var(--border-width)) var(--border-strong)', // Fader.css cap (--yh-fader-line)
  texture: 'none', // Fader.css cap (the ::after line is an indicator, not texture)
};

/** A lamp blooms by the palette's bloom (0px on flat palettes). */
const flatLit: Materials['lit'] = { radius: 'var(--bloom)', strength: '100%' }; // Fader.css fill, Pad.css, Button.css, library.css .lib-lamp: 0 0 var(--bloom) var(--lit)

const flat = { well: flatWell, screen: flatScreen, key: flatKey, handle: flatHandle, lit: flatLit, light: '180deg' };

/** A flat layer's hairline: an inset ring in the border colour. */
const hairline = (colour: string) => `inset 0 0 0 var(--border-width) ${colour}`;

/**
 * The flat stack above the base, shared by the four flat sets: a raised control one tone step up
 * from its base, then floats, sheets and toasts as opaque raised surfaces ringed by a strong
 * hairline, their cast shadows growing with depth. The base and the raised step differ per set.
 */
function flatLayers(base: Layer, raised: Layer): Record<LayerName, Layer> {
  return {
    ground: plain('var(--surface-0)'), // the page
    base,
    raised,
    float: {
      ...plain('var(--surface-2)'), // MetronomePopover.css
      edge: hairline('var(--border-strong)'), // added
      cast: `0 8px 24px -8px ${shade(0.6)}`, // added
    },
    overlay: {
      ...plain('var(--surface-3)'), // added: a sheet, a step past a popover
      edge: hairline('var(--border-strong)'), // added
      cast: `0 18px 48px -12px ${shade(0.7)}`, // added
    },
    top: {
      ...plain('var(--surface-3)'), // added: a toast
      edge: hairline('var(--border-strong)'), // added
      cast: `0 24px 56px -12px ${shade(0.75)}`, // added
    },
  };
}

const bare: Material = { fill: 'transparent', shadow: NO_SHADOW, texture: 'none' };

/** Underline tabs: printed labels, the chosen one underlined in ink (Push's nav, Ableton's rules). */
const underlineTabs: Materials['tabs'] = {
  track: bare,
  tab: bare,
  chosen: { fill: 'transparent', shadow: 'inset 0 -2px 0 var(--text-1)', texture: 'none' }, // ChosenTabs underline look
  ink: 'var(--text-3)',
  chosenInk: 'var(--text-1)',
  pad: '0px',
  gap: 'var(--space-3)',
  tabPad: '0 0 var(--space-1)',
};

export const pushMaterials: Materials = {
  id: 'push',
  label: 'yahaha Push (no boxes, hairlines)',
  radiusControl: '0px', // chromes.ts push
  radiusCard: '0px', // chromes.ts push
  radiusInput: '0px', // chromes.ts push
  radiusPill: '0px', // chromes.ts push
  borderWidth: '1px', // chromes.ts push
  input: 'underline', // chromes.ts push
  layers: flatLayers(
    {
      ...plain('transparent', 'var(--surface-0)'), // chromes.ts push card.fill none; solid: the ground it shows
      edge: 'inset 0 1px 0 var(--border)', // chromes.ts push card.borderTop 1px, sides 0
    },
    plain('var(--surface-1)'), // added: no boxes, so a control's plate is one tone step, no edge
  ),
  plate: {
    inset: 'var(--space-2) 0 0', // added: Push has no boxes; a region is its hairline and the room under it
    gap: 'var(--space-4)', // added
    head: { inset: 'var(--space-2) 0 0', rule: NO_SHADOW }, // added: the base's hairline already heads it
  },
  tabs: underlineTabs,
  ...flat,
};

export const elektronMaterials: Materials = {
  id: 'elektron',
  label: 'Elektron (square, flat panels)',
  radiusControl: '0px', // chromes.ts elektron
  radiusCard: '0px', // chromes.ts elektron
  radiusInput: '7px', // chromes.ts elektron
  radiusPill: '0px', // chromes.ts elektron
  borderWidth: '1.5px', // chromes.ts elektron
  input: 'filled', // chromes.ts elektron
  layers: flatLayers(
    plain('var(--surface-1)'), // chromes.ts elektron card.fill surface; no borders, no shadow
    plain('var(--surface-2)'), // added: a flat panel one step up, still no borders
  ),
  plate: {
    inset: 'var(--space-3)', // added: a flat filled panel needs room inside
    gap: 'var(--space-2)', // added: panels butt up close, like hardware sections
    head: { inset: 'var(--space-2) var(--space-3) 0', rule: NO_SHADOW }, // added
  },
  tabs: {
    // added: Elektron's square filled selection, as its screens' page tabs
    track: bare,
    tab: bare,
    chosen: { fill: 'var(--selected)', shadow: NO_SHADOW, texture: 'none' },
    ink: 'var(--text-3)',
    chosenInk: 'var(--selected-text)',
    pad: '0px',
    gap: 'var(--space-1)',
    tabPad: '0 var(--space-2)',
  },
  ...flat,
};

export const abletonMaterials: Materials = {
  id: 'ableton',
  label: 'Ableton (square, rules)',
  radiusControl: '0px', // chromes.ts ableton
  radiusCard: '0px', // chromes.ts ableton
  radiusInput: '0px', // chromes.ts ableton
  radiusPill: '0px', // chromes.ts ableton
  borderWidth: '1px', // chromes.ts ableton
  input: 'filled', // chromes.ts ableton
  layers: flatLayers(
    {
      ...plain('transparent', 'var(--surface-0)'), // chromes.ts ableton card.fill none; solid: the ground it shows
      edge: 'inset 0 2px 0 var(--border)', // chromes.ts ableton card.borderTop 2px, sides 0
    },
    { ...plain('var(--surface-2)'), edge: hairline('var(--border)') }, // added: Studio Gray, ruled
  ),
  plate: {
    inset: 'var(--space-2) 0 0', // added: a ruled region, the 2px rule then room
    gap: 'var(--space-4)', // added
    head: { inset: 'var(--space-2) 0 0', rule: NO_SHADOW }, // added: the 2px rule heads it
  },
  tabs: underlineTabs,
  ...flat,
};

export const linearMaterials: Materials = {
  id: 'linear',
  label: 'Linear (6px, layered)',
  radiusControl: '6px', // chromes.ts linear
  radiusCard: '6px', // chromes.ts linear
  radiusInput: '6px', // chromes.ts linear
  radiusPill: '9999px', // chromes.ts linear
  borderWidth: '1px', // chromes.ts linear
  input: 'box', // chromes.ts linear
  layers: flatLayers(
    {
      ...plain('var(--surface-1)'), // chromes.ts linear card.fill surface
      edge: 'inset 0 0 0 1px var(--border)', // chromes.ts linear card: 1px border all round
      cast: `0 2px 4px 0 ${shade(0.4)}`, // chromes.ts linear card: rgba(0, 0, 0, 0.4) 0 2px 4px as a palette shade
    },
    {
      ...plain('var(--surface-2)'), // added: Linear's next layer up
      edge: 'inset 0 0 0 1px var(--border-strong)', // added
      cast: `0 1px 2px 0 ${shade(0.3)}`, // added: as its segmented chip
    },
  ),
  plate: {
    inset: 'var(--space-3)', // added: a layered card
    gap: 'var(--space-3)', // added
    head: { inset: 'var(--space-2) var(--space-3)', rule: 'inset 0 -1px 0 var(--border)' }, // added: Linear's ruled card header
  },
  tabs: {
    // added: Linear's segmented control, a raised chip in a sunk track
    track: { fill: 'var(--surface-0)', shadow: 'inset 0 0 0 1px var(--border)', texture: 'none' },
    tab: bare,
    chosen: { fill: 'var(--surface-3)', shadow: `inset 0 0 0 1px var(--border-strong), 0 1px 2px ${shade(0.3)}`, texture: 'none' },
    ink: 'var(--text-3)',
    chosenInk: 'var(--text-1)',
    pad: '2px',
    gap: '2px',
    tabPad: '0 var(--space-3)',
  },
  ...flat,
};

// ── Hardware (Yahaha's pre-minimalism UI) ────────────────────────────────────────────────────────
// One light from above (`light: 180deg`): every specular edge is on the top (inset 0 1px), every
// shade on the bottom, and every cast shadow falls straight down, longer the higher the layer.

/** app.css --raised-hi → --raised-lo: the key's own level lifted at the top, settled at the bottom. */
const raised = `linear-gradient(180deg, color-mix(in oklab, var(--surface-2), ${light(1)} 22%), color-mix(in oklab, var(--surface-2), ${shade(1)} 6%))`;

/** app.css .mat-chassis: linear-gradient(180deg, --chassis-hi, --chassis-lo 65%). */
const chassis = `linear-gradient(180deg, color-mix(in oklab, var(--surface-1), ${light(1)} 10%), var(--surface-1) 65%)`;

/** app.css .mat-chassis brushing: fine horizontal light lines, wider vertical dark ones. */
const brushing = `repeating-linear-gradient(0deg, ${light(0.018)} 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, ${shade(0.025)} 0 2px, transparent 2px 5px)`;

/** A hardware layer standing above the chassis: the raised material, its seam, a lit top edge and a
 *  drop shadow falling `drop` px below it (popovers: app.css .mat-chassis drop, 0 18px 40px -12px). */
function hardwareLift(drop: number, blur: number, spread: number, alpha: number): Layer {
  return {
    fill: raised, // app.css popovers sit on the raised material
    solid: raised,
    texture: 'none',
    backdrop: 'none',
    edge: `inset 0 1px 0 ${light(0.16)}`, // app.css .mat-chassis inset 0 1px 0 --chassis-edge
    cast: `0 0 0 1px ${shade(0.5)}, 0 ${drop}px ${blur}px ${spread}px ${shade(alpha)}`, // app.css .mat-chassis seam and drop
  };
}

export const hardwareMaterials: Materials = {
  id: 'hardware',
  label: 'Hardware (bevelled caps, inset wells, LCD)',
  radiusControl: '5px', // HwButton.svelte .btn border-radius
  radiusCard: '12px', // app.css --r-panel
  radiusInput: '4px', // Fader.svelte .track border-radius
  radiusPill: '9999px', // added
  borderWidth: '1px', // app.css .mat-raised, .mat-chassis borders
  input: 'filled', // added: fields sit in the panel like wells
  light: '180deg', // app.css: every bevel is lit from above
  layers: {
    ground: plain('var(--surface-0)'), // app.css --bg: the desk the chassis sits on
    base: {
      fill: chassis, // app.css .mat-chassis
      solid: chassis,
      texture: brushing, // app.css .mat-chassis brushing
      backdrop: 'none',
      edge: [
        `inset 0 1px 0 ${light(0.16)}`, // app.css .mat-chassis inset 0 1px 0 --chassis-edge
        `inset 0 -1px 0 ${shade(0.35)}`, // app.css .mat-chassis
      ].join(', '),
      cast: [
        `0 0 0 1px ${shade(0.55)}`, // app.css .mat-chassis border: 1px solid --seam
        `0 18px 40px -18px ${shade(0.7)}`, // app.css .mat-chassis
        `0 2px 0 ${shade(0.25)}`, // app.css .mat-chassis
      ].join(', '),
    },
    raised: {
      // added: a control's own plate (Master's), a sub-panel of raised material on the chassis
      fill: raised,
      solid: raised,
      texture: 'none',
      backdrop: 'none',
      edge: `inset 0 1px 0 ${light(0.18)}, inset 0 -1px 0 ${shade(0.3)}`, // app.css .mat-raised
      cast: `0 0 0 1px ${shade(0.45)}, 0 2px 0 ${shade(0.35)}, 0 4px 8px -3px ${shade(0.5)}`, // app.css .mat-raised, eased for a plate
    },
    float: hardwareLift(18, 40, -12, 0.7), // app.css .mat-chassis drop under a popover
    overlay: hardwareLift(28, 60, -16, 0.75), // added: a sheet stands further off
    top: hardwareLift(36, 72, -18, 0.8), // added: a toast stands furthest
  },
  plate: {
    inset: 'var(--space-3)', // app.css .panel padding (14–16px at the source's scale)
    gap: 'var(--space-3)', // app.css: panels a dozen px apart on the chassis
    head: { inset: 'var(--space-2) var(--space-3) 0', rule: NO_SHADOW }, // HwButton rows sit near the panel's top edge
  },
  tabs: {
    // HwButton.svelte selector rows: buttons set in a sunk well, the chosen one raised and lit ink
    track: { fill: 'var(--mat-well-fill)', shadow: 'var(--mat-well-shadow)', texture: 'none' },
    tab: bare,
    chosen: { fill: 'var(--mat-key-fill)', shadow: 'var(--mat-key-shadow)', texture: 'none' },
    ink: 'var(--text-3)',
    chosenInk: 'var(--text-1)',
    pad: '3px',
    gap: '2px',
    tabPad: '0 var(--space-3)',
  },
  well: {
    // app.css .mat-well: linear-gradient(180deg, --well-edge, --well 30%)
    fill: `linear-gradient(180deg, color-mix(in oklab, var(--surface-0), ${shade(1)} 45%), color-mix(in oklab, var(--surface-0), ${shade(1)} 30%) 30%)`,
    shadow: [
      `inset 0 2px 4px ${shade(0.6)}`, // app.css .mat-well
      `inset 0 -1px 0 ${light(0.04)}`, // app.css .mat-well
      `0 1px 0 ${light(0.06)}`, // app.css .mat-well
    ].join(', '),
    texture: 'none', // app.css .mat-well
  },
  screen: {
    // app.css .mat-screen: radial-gradient(140% 120% at 30% 0%, #10191e, --screen-bg 60%); the
    // source's blue-black glass becomes the ground, tinted by the accent and sunk a step, so text-1
    // stays readable on it in light mode too.
    fill: `radial-gradient(140% 120% at 30% 0%, color-mix(in oklab, var(--surface-0), var(--accent) 6%), color-mix(in oklab, var(--surface-0), ${shade(1)} 12%) 60%)`,
    shadow: [
      `inset 0 0 0 1px ${shade(0.6)}`, // app.css .mat-screen border: 1px solid --well-edge
      `inset 0 0 0 2px ${light(0.03)}`, // app.css .mat-screen inset 0 0 0 1px (inside the border)
      `inset 0 6px 18px ${shade(0.6)}`, // app.css .mat-screen (0.75 in source; eased for light-mode glass)
      `0 1px 0 ${light(0.07)}`, // app.css .mat-screen
    ].join(', '),
    texture: `linear-gradient(160deg, ${light(0.07)}, transparent 38%)`, // app.css .mat-screen::after sheen
  },
  key: {
    fill: raised, // app.css .mat-raised
    shadow: [
      `0 0 0 1px ${shade(0.45)}`, // app.css .mat-raised border: 1px solid rgb(0 0 0 / 0.45)
      `inset 0 1px 0 ${light(0.18)}`, // app.css .mat-raised
      `0 2px 0 ${shade(0.45)}`, // app.css .mat-raised
      `0 3px 6px -2px ${shade(0.5)}`, // app.css .mat-raised
    ].join(', '),
    texture: 'none', // app.css .mat-raised
    pressed: [
      `0 0 0 1px ${shade(0.45)}`, // app.css .mat-raised border
      `inset 0 1px 2px ${shade(0.4)}`, // app.css .mat-raised.pressed
      `0 1px 0 ${shade(0.45)}`, // app.css .mat-raised.pressed
    ].join(', '),
  },
  handle: {
    fill: raised, // Fader.svelte .cap linear-gradient(--raised-hi, --raised-lo); Knob.svelte cap gradient
    shadow: [
      `0 0 0 1px ${shade(0.45)}`, // Knob.svelte cap stroke rgb(0 0 0 / 0.45)
      `inset 0 1px 0 ${light(0.18)}`, // app.css .mat-raised
      `0 2px 3px -1px ${shade(0.5)}`, // added: the cap stands off the well
    ].join(', '),
    // Fader.svelte .cap grip lines; its centre line stays the component's indicator
    texture: `repeating-linear-gradient(180deg, ${light(0.1)} 0 1px, transparent 1px 3px)`,
  },
  lit: {
    // Fader.svelte lit fill: 0 0 8px color-mix(accent 70%, transparent); max() with bloom added
    radius: 'max(8px, var(--bloom))',
    strength: '70%',
  },
};

// ── Frost (visual[flow] 1.0, openflowfm/visuals) ─────────────────────────────────────────────────
// Native macOS HUD frost behind a transparent window: the page paints only faint tints over it
// (home.css --surface-0..3, which the frost palette carries), and from raised up, sheets of frosted
// glass, a step more blur per layer (the ramp below). Near borderless: areas are parted by space
// and tone (decision 68). Over the native preview nothing may be translucent: panels there paint
// opaque #18181a (stage.css), the window layers' `solid`, the sheets a step lighter. Nothing animates.

/**
 * The frost's opaque and glass tones, from the palette's ink so they turn over with the mode: the
 * ink's lightness mirrored (`k - l`), at `alpha`. In the dark mode (ink #ececed) k 1.15 gives about
 * #18181a, stage.css's --surface-corner, and k 1.13 about rgb(20 20 24), home.css's
 * --surface-float; in the light mode a pale glass the same distance from white.
 */
function frostTone(k: number, alpha = 1): string {
  return `oklch(from var(--text-1) calc(${k} - l) c h / ${alpha})`;
}

/** stage.css: every panel over the native preview paints opaque --surface-corner (#18181a). */
const frostSolid = frostTone(1.15);

/** A hairline on the lit side (the materials' `light`, `--light-angle`), as Surface's ambient edge
 *  places it: at 180deg the top edge. */
const litEdge = (colour: string) =>
  `inset calc(sin(var(--light-angle)) * var(--border-width)) calc(cos(var(--light-angle)) * -1 * var(--border-width)) 0 ${colour}`;

/**
 * The plain glass (docs/shader-graph.md, "Liquid glass"), now only the graph's chips and zones
 * (the floating layers are frost's sheets, below). It was popovers', menus', sheets' and toasts'
 * look, and the CSS look under the shader glass. It replaced visual[flow]'s HUD glass (popover.css / home.css: --surface-float
 * at 0.86–0.9 over `blur(28px) saturate(1.6)`, a 7% white top edge), which read as a dark, heavily
 * saturated slab. Now: a thinner tint, a softer blur that keeps the colours behind true, a light
 * rim all round brighter on the lit side, and a soft highlight falling from the lit edge. The
 * tones turn over with the mode (frostTone, light), so it is dark glass in the dark mode and pale
 * glass in the light.
 */
function glass(alpha: number, lift: string): Layer {
  return {
    fill: frostTone(1.13, alpha), // home.css --surface-float's tone; alpha thinned (was 0.86–0.9)
    solid: frostSolid, // stage.css: over the preview, opaque --surface-corner and no blur
    // added: a soft highlight from the lit edge, gone by mid-pane
    texture: `linear-gradient(var(--light-angle), ${light(0.12)}, ${light(0.03)} 35%, ${light(0)} 60%)`,
    backdrop: 'blur(20px) saturate(1.15)', // added: was home.css --glass blur(28px) saturate(1.6)
    // added: a light rim all round, brighter on the lit side (was home.css --glass-edge, a 7% top line)
    edge: [litEdge(light(0.22)), hairline(light(0.1))].join(', '),
    cast: lift,
  };
}

const quiet = (fill: string): Material => ({ fill, shadow: NO_SHADOW, texture: 'none' });

// ── Frost's layer ramp (visuals' "Glass layers", openflowfm/visuals#289) ────────────────────────
// Each layer up the stack is another sheet of the same frosted glass over the one under it. The
// owner's rule: a component placed on a layer takes that layer's material and never sets its own
// fill, blur, tint, border or text colour. A popover is the sidebars' material (raised) popping
// over: no border, lit edge or hairline, the same text steps, only a soft elevation shadow and one
// more step of blur to say "above".

/** frost's raised tone, opaque: a step lighter than the panel's solid. Every sheet's `solid`. */
const sheetSolid = `color-mix(in oklab, ${frostSolid}, var(--text-1) 4%)`;

/** The share of its solid tone a sheet keeps over whatever is behind it: the floor that lets a
 *  sidebar read solid and holds its captions' and icons' contrast over any desktop or picture. */
const SHEET_FLOOR = '62%'; // visuals.css --vs-glass-raised-floor

/** One step of blur (visuals.css --vs-glass-blur, 8px): raised two steps over the window, then
 *  one more per layer up. Saturation rises a little with it, so colour behind stays alive. */
const sheetBlur = (steps: number, saturate: number) => `blur(${steps * 8}px) saturate(${saturate})`;

/**
 * A soft elevation shadow, a wide fall-off and a tight contact shadow, `depth` px long. Softer in
 * the light mode (`--scheme-light`), where a dark mode's shadow reads as a smudge.
 */
function elevation(depth: number, alpha: number): string {
  const a = (k: number) => `oklch(0 0 0 / calc(${alpha * k} * (1 - var(--scheme-light) * 0.45)))`;
  return `0 ${depth}px ${depth * 2.5}px ${-depth * 0.6}px ${a(1)}, 0 ${Math.round(depth / 6)}px ${Math.round(depth / 2)}px ${a(0.45)}`;
}

/**
 * The captions and icons on frosted glass: the caption a sixth of the way to the ink (visuals.css
 * --vs-caption-raised, home.css --caption-raised #b0b0b8), and icons on the palette's caption, not
 * its faint step, which came and went with whatever was behind the glass (InsetSidebar.css).
 */
const sheetInk: LayerInk = {
  secondary: 'color-mix(in oklab, var(--text-3), var(--text-1) 17%)',
  faint: 'var(--text-3)',
};

/** A sheet of frosted glass `steps` blur steps up, casting `cast`. */
function sheet(steps: number, saturate: number, cast: string): Layer {
  return {
    fill: `color-mix(in oklab, ${sheetSolid} ${SHEET_FLOOR}, transparent)`,
    solid: sheetSolid,
    texture: 'none',
    backdrop: sheetBlur(steps, saturate),
    edge: NO_SHADOW,
    cast,
  };
}

/**
 * design-os decision 85: frost takes the preview's ambient light (owner: "the glass material to
 * react to the preview video"), as Apple TV's and YouTube's ambient modes do. The colour is held
 * to an OKLab lightness band before it tints: at most 0.33 in the dark mode (no lighter than the
 * page over the lightest HUD, #3c3c3c) and at least 0.87 in the light (no darker than the light
 * frost, #e6e6e6). So a tint only moves hue, never the captions' contrast: the worst in-gamut
 * colour, at any share, keeps `--text-3` at 4.75:1 (dark) and 4.70:1 (light). The shares are what
 * reads as glass catching light: more on what floats, less on the page's tints.
 */
function frostAmbient(fill: string, edge: string, cast: string): LayerAmbient {
  return {
    fill, // added
    edge, // added
    cast, // added
    lightness: ['calc(var(--scheme-light) * 0.87)', 'calc(0.33 + var(--scheme-light) * 0.67)'], // added: the bands above
  };
}

export const frostMaterials: Materials = {
  id: 'frost',
  label: 'Frost (visual[flow] glass)',
  radiusControl: '8px', // layout.css --lay-row-radius: a row's pill, a control
  radiusCard: '10px', // popover.css: the glass panels' corners
  radiusInput: '8px', // layout.css --lay-row-radius
  radiusPill: '9999px', // the inspector's "+ Tag" chip
  borderWidth: '1px', // added: near borderless; only the selection and focus rings draw a line
  input: 'filled', // the library's search: a tint, no box
  light: '180deg', // home.css --glass-edge: the top edge catches the light
  layers: {
    // app.css: transparent all the way down; the native HUD frost shows through
    ground: plain('transparent', frostSolid),
    // home.css --surface-0: the window's areas (header, sidebar, main pane, bar), no edge
    base: plain('var(--surface-0)', frostSolid),
    // The sheets (the ramp above): the inset sidebars and chips, two blur steps over the window, no
    // cast of their own (a window-edge panel takes the float's, Assembly.css)
    raised: sheet(2, 1.2, NO_SHADOW), // visuals.css glass layers: blur 16px, saturate(1.2), the 62% floor
    float: sheet(3, 1.3, elevation(12, 0.4)), // added: a popover or menu, the raised sheet a step up (popover.css --lift, softened)
    overlay: sheet(4, 1.4, elevation(24, 0.5)), // added: a sheet or modal, a step further (palette.css --shadow-modal, softened)
    top: sheet(5, 1.4, elevation(16, 0.45)), // added: a toast, nearest the light
  },
  // added: the graph under frosted glass. A chip is a glass pane lighter than a popover with a
  // shorter lift; a zone a thinner pane with no cast, so the chips on it read in front.
  graph: {
    node: {
      ...glass(0.66, '0 6px 16px oklch(0 0 0 / 0.35)'), // added: was 0.72 over the old HUD glass
      solid: sheetSolid, // added: raised's solid
    },
    zone: {
      ...glass(0.4, NO_SHADOW), // added
      fill: frostTone(1.05, 0.45), // added: a step deeper than the chips' glass, so the pane reads in the light mode too
      solid: `color-mix(in oklab, ${frostSolid}, var(--text-1) 2%)`, // added: a step under the chips
      texture: 'none', // added: thin, no highlight, so the chips on it carry the light
      backdrop: 'blur(16px) saturate(1.1)', // added
      edge: [litEdge(light(0.1)), hairline(light(0.05))].join(', '), // added: the glass's rim, fainter
    },
  },
  // No shader glass on the floating layers any more: the glass shader draws a rim, a sheen and an
  // outline, and a floating sheet is the raised material with only a shadow (the ramp above). An app
  // can still put it back per layer (`materials.shaders` in a skin, or a Surface's `shader` prop).
  // design-os decision 85: the page's tints take a little of the picture (a tint only: regions have
  // no edge). The floating sheets take none: held dark, the picture's colour read as an olive slab
  // (visuals.css glass layers, --layer-float-ambient-fill 0%), and they have no edge to colour.
  ambient: {
    base: frostAmbient('24%', '0%', '0%'),
    raised: frostAmbient('20%', '0%', '0%'),
  },
  // added: every sheet's captions and icons hold their contrast on glass (the ramp above)
  ink: { raised: sheetInk, float: sheetInk, overlay: sheetInk, top: sheetInk },
  plate: {
    inset: '22px', // home.css --pad: the main column's one padding
    gap: '32px', // layout.css --lay-section-gap
    head: { inset: 'var(--space-3) 22px 0', rule: NO_SHADOW }, // decision 68: no lines; the header shares --pad's edge
  },
  tabs: {
    // docs/design-os-decisions.md 81 (the owner, over Apple's segmented thumb and visuals decision
    // 68's underline): a switch
    // is plain type, like the header's glyph buttons. No track, no face, no underline, no thumb;
    // only the ink tells the chosen one.
    track: bare,
    tab: bare,
    chosen: bare,
    ink: 'var(--text-2)', // the header's panel toggles at rest
    chosenInk: 'var(--text-1)', // the toggles open or hovered: white in the dark mode
    pad: '0px',
    gap: 'var(--space-3)', // added: tight, about the toolbar glyphs' spacing
    tabPad: '0px',
  },
  // design-os decision 82: Apple's slider groove (macOS 27 UI Kit, openflowfm/visuals kit/tokens.css
  // --mac-*-tracks-active-unfilled-bg: black 10–27% light, white 7–10% dark), as the ink at 12% so
  // it reads in both modes. Was home.css's --surface-2, which all but vanished on light frost.
  well: quiet('color-mix(in oklab, var(--text-1) 12%, transparent)'),
  screen: quiet('var(--surface-1)'), // home.css --surface-1: the now playing panel, one faint step
  key: { ...quiet('var(--surface-2)'), pressed: `inset 0 0 0 100vmax var(--surface-3)` }, // home.css --surface-3: a pressed key
  handle: {
    // design-os decision 82: Apple's knob (kit --mac-*-knobs-toggle-idle-bg, white 87.5%): a pale cap,
    // its alpha following --surface-3's (0.6 light, 0.05 dark), so ~0.98 on light frost and ~0.83 on dark
    fill: 'oklch(from var(--surface-3) calc(0.8 + l * 0.2) 0 h / calc(0.76 + alpha * 0.36))',
    // added: under reduced transparency the same pale cap at full alpha, so the groove never shows through
    solid: 'oklch(from var(--surface-3) calc(0.8 + l * 0.2) 0 h / 1)',
    // kit --mac-*-knobs-toggle-idle-shadow: a specular top edge, a hairline rim, a soft cast (lit from above)
    shadow: [`inset 0 1px 0 ${light(0.6)}`, `0 0 0 0.5px ${shade(0.18)}`, `0 1px 3px ${shade(0.3)}`].join(', '),
    texture: 'none',
  },
  lit: flatLit, // added: the frost palette has no bloom
  // access.css --vf-focus-ring (the ui ink): the focus ring is the controls' ink, not the accent,
  // drawn on the edge (visuals' `outline: 2px solid; outline-offset: 0`)
  focus: { ink: 'var(--text-2)', offset: '0px' },
};

export const materials: Materials[] = [
  pushMaterials,
  elektronMaterials,
  abletonMaterials,
  linearMaterials,
  hardwareMaterials,
  frostMaterials,
];
