import type { Material, Materials } from '../contract';

// Materials: shape plus what each part is made of. Every value reads palette variables, so a set
// works with every palette in light and dark.
//
// The four flat sets share one face per role, lifted from the Yahaha widgets as they are drawn
// today; only shape and the plate (the old Chrome `card`) differ between them. `hardware` is the
// skeuomorphic set from Yahaha's pre-minimalism UI (old-ui/app/src/app.css material recipes).

/** No shadow, as a real shadow: `none` is invalid inside a box-shadow list, and components list a
 *  material shadow alongside their own state rings. */
const NO_SHADOW = '0 0 0 0 transparent';

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
const flatLit = { glow: '0 0 var(--bloom) var(--lit)' }; // Fader.css fill, Pad.css, Button.css, library.css .lib-lamp

const flat = { well: flatWell, screen: flatScreen, key: flatKey, handle: flatHandle, lit: flatLit };

export const pushMaterials: Materials = {
  id: 'push',
  label: 'yahaha Push (no boxes, hairlines)',
  radiusControl: '0px', // chromes.ts push
  radiusCard: '0px', // chromes.ts push
  radiusInput: '0px', // chromes.ts push
  radiusPill: '0px', // chromes.ts push
  borderWidth: '1px', // chromes.ts push
  input: 'underline', // chromes.ts push
  plate: {
    fill: 'transparent', // chromes.ts push card.fill none
    shadow: 'inset 0 1px 0 var(--border)', // chromes.ts push card.borderTop 1px, sides 0
    texture: 'none', // chromes.ts push
  },
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
  plate: {
    fill: 'var(--surface-1)', // chromes.ts elektron card.fill surface
    shadow: NO_SHADOW, // chromes.ts elektron card: no borders, no shadow
    texture: 'none', // chromes.ts elektron
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
  plate: {
    fill: 'transparent', // chromes.ts ableton card.fill none
    shadow: 'inset 0 2px 0 var(--border)', // chromes.ts ableton card.borderTop 2px, sides 0
    texture: 'none', // chromes.ts ableton
  },
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
  plate: {
    fill: 'var(--surface-1)', // chromes.ts linear card.fill surface
    // chromes.ts linear card: 1px border all round, then rgba(0, 0, 0, 0.4) 0 2px 4px as a palette shade
    shadow: `inset 0 0 0 1px var(--border), 0 2px 4px 0 ${shade(0.4)}`,
    texture: 'none', // chromes.ts linear
  },
  ...flat,
};

// ── Hardware (Yahaha's pre-minimalism UI) ────────────────────────────────────────────────────────
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

/** app.css --raised-hi → --raised-lo: the key's own level lifted at the top, settled at the bottom. */
const raised = `linear-gradient(180deg, color-mix(in oklab, var(--surface-2), ${light(1)} 22%), color-mix(in oklab, var(--surface-2), ${shade(1)} 6%))`;

export const hardwareMaterials: Materials = {
  id: 'hardware',
  label: 'Hardware (bevelled caps, inset wells, LCD)',
  radiusControl: '5px', // HwButton.svelte .btn border-radius
  radiusCard: '12px', // app.css --r-panel
  radiusInput: '4px', // Fader.svelte .track border-radius
  radiusPill: '9999px', // added
  borderWidth: '1px', // app.css .mat-raised, .mat-chassis borders
  input: 'filled', // added: fields sit in the panel like wells
  plate: {
    // app.css .mat-chassis: linear-gradient(180deg, --chassis-hi, --chassis-lo 65%)
    fill: `linear-gradient(180deg, color-mix(in oklab, var(--surface-1), ${light(1)} 10%), var(--surface-1) 65%)`,
    shadow: [
      `0 0 0 1px ${shade(0.55)}`, // app.css .mat-chassis border: 1px solid --seam
      `inset 0 1px 0 ${light(0.16)}`, // app.css .mat-chassis inset 0 1px 0 --chassis-edge
      `inset 0 -1px 0 ${shade(0.35)}`, // app.css .mat-chassis
      `0 18px 40px -18px ${shade(0.7)}`, // app.css .mat-chassis
      `0 2px 0 ${shade(0.25)}`, // app.css .mat-chassis
    ].join(', '),
    // app.css .mat-chassis brushing: fine horizontal light lines, wider vertical dark ones
    texture: `repeating-linear-gradient(0deg, ${light(0.018)} 0 1px, transparent 1px 3px), repeating-linear-gradient(90deg, ${shade(0.025)} 0 2px, transparent 2px 5px)`,
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
    glow: '0 0 max(8px, var(--bloom)) color-mix(in oklab, var(--lit) 70%, transparent)',
  },
};

export const materials: Materials[] = [pushMaterials, elektronMaterials, abletonMaterials, linearMaterials, hardwareMaterials];
