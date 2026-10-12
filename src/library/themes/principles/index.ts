import type { PackPrinciples } from '../../contract';

// Layout principles per system: what the assembly solver (src/library/layout/assembly) reads
// beside the facets. docs/assembly.md explains each field; visuals.md beside this file is the
// visual[flow] source, and src/library/yahaha/STAGE.md the Yahaha one.

/**
 * WCAG 2.2 target size (minimum), 2.5.8: 24 × 24 CSS px. No source sets its own, so every pack
 * uses it. // added
 */
const WCAG_TARGET = 24;

/** Yahaha on stage (STAGE.md): a player a metre away, mid-song. */
export const yahaha: PackPrinciples = {
  minTarget: WCAG_TARGET,
  // STAGE.md 5: every concept on one screen from 1440 × 900 down to 1217 × 752, so keep the
  // richest form that fits rather than dropping to a sparser one.
  density: 'dense',
  // added: Region bodies stack their groups at step 2; groups keep their controls at step 2 (Group's default).
  gaps: { body: 2, group: 2 },
  // STAGE.md 1: now playing (section, chord), then tempo, then what's next, then the controls.
  ranks: ['now', 'next', 'controls', 'context', 'chrome'],
  notes: [
    'Now playing and tempo are the loudest things on screen and the last to shrink (STAGE.md 1): the hero is `now`.',
    "What's next (the song form) is `next`; the mixer, knobs, pads and transport are `controls`.",
    'The app bar, the keys and the status line are fixed: the header and footer never step down or zoom.',
    'One column seam from the bar to the keys: the hero and the mixer are a pair.',
  ],
};

/** visual[flow] 1.0 (visuals.md): areas parted by space and tone, an inspector layout. */
export const visuals: PackPrinciples = {
  minTarget: WCAG_TARGET,
  // visuals.md, Layout: 22px padding, 32px between sections; room is part of the look, so a
  // region keeps its ideal size and a sparser form comes sooner.
  density: 'roomy',
  // home.css: 16px between tiles (step 4 at the roomy scale), 8px between controls (step 2).
  gaps: { body: 4, group: 2 },
  ranks: ['now', 'next', 'controls', 'context', 'chrome'],
  notes: [
    'The preview (what is playing) is `now`: it never shrinks first.',
    'The sidebar docks from 900px wide and the inspector from 1200px: give each a docked and an overlaid form, and rank them `context` so they go before the main column does.',
    'The header row holds only type and never steps down.',
  ],
};

/** Desktop studio packs (Elektron, Ableton, Linear): a dense working surface at a desk. */
export const studio: PackPrinciples = {
  minTarget: WCAG_TARGET,
  density: 'balanced', // added: no source says; halfway between a form's least and its ideal
  gaps: { body: 3, group: 2 }, // added
  notes: ['No source states a layout priority; regions rank by what they show (now, next, controls).'],
};
