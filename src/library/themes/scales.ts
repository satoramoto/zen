import type { Scale } from '../contract';

// Type sizes, spacing unit and control height grow together. Compact keeps the sizes the Push and
// Elektron type facets had; regular keeps Ableton's.

const compact: Scale = {
  id: 'compact',
  label: 'Compact (4px)',
  unit: 4,
  control: 28,
  sizes: { caption: 11, body: 14, label: 13, heading: 22, display: 44, numeral: 32 },
};

const regular: Scale = {
  id: 'regular',
  label: 'Regular (5px)',
  unit: 5,
  control: 34,
  sizes: { caption: 12, body: 16, label: 14, heading: 24, display: 56, numeral: 36 }, // added: numeral 36 (Ableton had 32)
};

const airy: Scale = {
  id: 'airy',
  label: 'Airy (6px)',
  unit: 6,
  control: 40,
  sizes: { caption: 13, body: 18, label: 16, heading: 28, display: 64, numeral: 42 }, // added
};

export const scales: Scale[] = [compact, regular, airy];
