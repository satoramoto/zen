import type { TypeFacet } from '../contract';

// Proprietary faces are swapped for the substitutes Refero names.

export const pushType: TypeFacet = {
  id: 'push',
  label: 'yahaha Push (DM Sans)',
  sans: "'DM Sans', system-ui, sans-serif",
  display: "'DM Sans', system-ui, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace",
  readout: "'JetBrains Mono', ui-monospace, monospace",
  weightBody: 400,
  weightStrong: 500,
  weightDisplay: 300,
  weightNumeral: 300,
  tracking: '0em',
  trackingDisplay: '-0.01em',
  labelCase: 'none',
  scale: { caption: 11, body: 14, label: 13, heading: 20, display: 40, numeral: 32 },
};

export const elektronType: TypeFacet = {
  id: 'elektron',
  label: 'Elektron (Neue Haas Grotesk)',
  sans: "'Helvetica Neue', Arial, sans-serif",
  display: "'Helvetica Neue', Arial, sans-serif",
  mono: "'Share Tech Mono', ui-monospace, monospace",
  readout: "'Share Tech Mono', ui-monospace, monospace",
  weightBody: 400,
  weightStrong: 500,
  weightDisplay: 500,
  weightNumeral: 400,
  tracking: '-0.017em',
  trackingDisplay: '-0.04em',
  labelCase: 'uppercase',
  scale: { caption: 11, body: 14, label: 14, heading: 24, display: 48, numeral: 32 },
};

export const abletonType: TypeFacet = {
  id: 'ableton',
  label: 'Ableton (Futura → Jost)',
  sans: "'Jost', Futura, sans-serif",
  display: "'Jost', Futura, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, monospace", // added: the source has no mono
  readout: "'Jost', Futura, sans-serif",
  weightBody: 400,
  weightStrong: 400,
  weightDisplay: 700,
  weightNumeral: 400,
  tracking: 'normal',
  trackingDisplay: 'normal',
  labelCase: 'none',
  scale: { caption: 12, body: 16, label: 14, heading: 24, display: 56, numeral: 32 },
};

export const linearType: TypeFacet = {
  id: 'linear',
  label: 'Linear (Inter)',
  sans: "'Inter', system-ui, sans-serif",
  display: "'Inter', system-ui, sans-serif",
  mono: "'IBM Plex Mono', ui-monospace, monospace",
  readout: "'Inter', system-ui, sans-serif",
  weightBody: 400,
  weightStrong: 510,
  weightDisplay: 590,
  weightNumeral: 510,
  tracking: '-0.01em',
  trackingDisplay: '-0.022em',
  labelCase: 'none',
  scale: { caption: 10, body: 14, label: 13, heading: 24, display: 48, numeral: 32 },
};

export const types = [pushType, elektronType, abletonType, linearType];
