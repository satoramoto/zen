import type { Faces } from '../contract';

// Proprietary faces are swapped for the substitutes Refero names. Sizes live in scales.ts.

// added: no source style names a math face. Faces with an OpenType MATH table, most to least
// common across platforms, then the generic `math` (the browser's own MathML face).
const MATH = "'STIX Two Math', 'Cambria Math', 'Latin Modern Math', 'Noto Sans Math', math";

const push: Faces = {
  id: 'push',
  label: 'yahaha Push (DM Sans)',
  sans: "'DM Sans', system-ui, sans-serif",
  display: "'DM Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
  readout: "'JetBrains Mono', ui-monospace, monospace",
  math: MATH, // added
  weightBody: 400,
  weightStrong: 500,
  weightDisplay: 300,
  weightNumeral: 300,
  tracking: '0em',
  trackingDisplay: '-0.01em',
  labelCase: 'none',
};

// Yahaha before minimalism (ryangavin/yahaha@0dd53b6, app/src/app.css): Barlow for body,
// Barlow Condensed for display, engraved panel print in spaced caps.
const classic: Faces = {
  id: 'classic',
  label: 'yahaha classic (Barlow)',
  sans: "'Barlow', 'Helvetica Neue', Arial, sans-serif",
  display: "'Barlow Condensed', 'Arial Narrow', sans-serif",
  mono: "ui-monospace, 'SF Mono', Menlo, monospace",
  // The display glass draws its numerals in the condensed display face (tabular figures).
  readout: "'Barlow Condensed', 'Arial Narrow', sans-serif",
  math: MATH, // added
  weightBody: 400,
  weightStrong: 600,
  weightDisplay: 600,
  weightNumeral: 600,
  tracking: '0em',
  trackingDisplay: '0.06em',
  labelCase: 'uppercase',
};

const elektron: Faces = {
  id: 'elektron',
  label: 'Elektron (Neue Haas Grotesk)',
  sans: "'Helvetica Neue', Arial, sans-serif",
  display: "'Helvetica Neue', Arial, sans-serif",
  mono: "'Share Tech Mono', ui-monospace, monospace",
  readout: "'Share Tech Mono', ui-monospace, monospace",
  math: MATH, // added
  weightBody: 400,
  weightStrong: 500,
  weightDisplay: 500,
  weightNumeral: 400,
  tracking: '-0.017em',
  trackingDisplay: '-0.04em',
  labelCase: 'uppercase',
};

const ableton: Faces = {
  id: 'ableton',
  label: 'Ableton (Futura → Jost)',
  sans: "'Jost', Futura, sans-serif",
  display: "'Jost', Futura, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace", // added: the source has no mono
  readout: "'Jost', Futura, sans-serif",
  math: MATH, // added
  weightBody: 400,
  weightStrong: 400,
  weightDisplay: 700,
  weightNumeral: 400,
  tracking: 'normal',
  trackingDisplay: 'normal',
  labelCase: 'none',
};

const linear: Faces = {
  id: 'linear',
  label: 'Linear (Inter)',
  sans: "'Inter', system-ui, sans-serif",
  display: "'Inter', system-ui, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, monospace",
  readout: "'Inter', system-ui, sans-serif",
  math: MATH, // added
  weightBody: 400,
  weightStrong: 510,
  weightDisplay: 590,
  weightNumeral: 510,
  tracking: '-0.01em',
  trackingDisplay: '-0.022em',
  labelCase: 'none',
};

// visual[flow] 1.0 (openflowfm/visuals app/src/app.css, decision 69): one humane sans for UI,
// titles and numbers, Instrument Sans (wdth 75–100, wght 400–700). Numbers take tabular figures
// (`font-variant-numeric: tabular-nums`) rather than a monospace; the mono is only for code.
const instrument: Faces = {
  id: 'instrument',
  label: 'visual[flow] (Instrument Sans)',
  sans: "'Instrument Sans', system-ui, -apple-system, sans-serif", // app.css --sans
  display: "'Instrument Sans', system-ui, -apple-system, sans-serif", // home.css --font-display
  // app.css --code is Recursive (MONO 1); added: a system mono here, so no second webfont loads
  mono: "ui-monospace, 'SF Mono', Menlo, monospace",
  readout: "'Instrument Sans', system-ui, -apple-system, sans-serif", // home.css --font-num, tabular-nums
  math: MATH, // added
  weightBody: 400,
  weightStrong: 600, // home.css: titles and the chosen row
  weightDisplay: 650, // app.css .vf-mark
  weightNumeral: 400, // added: counts sit in the text's weight
  tracking: '0em',
  trackingDisplay: '-0.015em', // app.css .vf-mark
  labelCase: 'none', // decision 68: labels in sentence case ("Now playing")
};

// openflowfm/widgets type.css: the same Recursive family in a proportional and monospaced cut,
// CASL 0.38 in both. Music/theme.css self-hosts the exact Latin and Latin-ext variable subsets.
export const mixflowFaces: Faces = {
  id: 'mixflow', label: 'mix[flow] (Recursive)',
  sans: "'Recursive Variable', system-ui, -apple-system, sans-serif",
  display: "'Recursive Variable', system-ui, -apple-system, sans-serif",
  mono: "'Recursive Variable', ui-monospace, Menlo, monospace",
  readout: "'Recursive Variable', ui-monospace, Menlo, monospace",
  math: MATH, // added: the reference has no math role
  variation: {
    sans: "'MONO' 0, 'CASL' 0.38", display: "'MONO' 0, 'CASL' 0.38",
    mono: "'MONO' 1, 'CASL' 0.38", readout: "'MONO' 1, 'CASL' 0.38",
  },
  weightBody: 400, weightMedium: 500, weightStrong: 600, weightBold: 700,
  weightDisplay: 600, weightNumeral: 400,
  tracking: 'normal', trackingDisplay: 'normal', trackingTight: '-0.02em', trackingSlight: '0.04em', lineHeight: 'normal',
  trackingLabel: '0.08em', trackingCaps: '0.14em', labelCase: 'none',
};

export const faces: Faces[] = [push, classic, elektron, ableton, linear, instrument, mixflowFaces];
