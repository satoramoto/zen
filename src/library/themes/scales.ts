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

// visual[flow] 1.0 (openflowfm/visuals home.css, layout.css): a 4px unit whose steps land on its
// 8px insets, 16px tile gap and 32px section gap; controls between the 22px rail controls and
// the 40px sidebar rows. Its 22px --pad is the frost materials' plate inset, not a step here.
const roomy: Scale = {
  id: 'roomy',
  label: 'Roomy (4px, 30px controls)',
  unit: 4, // layout.css --lay-inset 8, --lay-tile-gap 16, --lay-section-gap 32
  control: 30, // added: between the header's controls and --lay-row 40
  // home.css: 12px captions and metadata, 13px body, 20px titles; display and numeral added
  sizes: { caption: 12, body: 13, label: 13, heading: 20, display: 32, numeral: 28 },
};

export const scales: Scale[] = [compact, regular, airy, roomy];
