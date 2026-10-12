import type { Faces, Facets, Materials, Palette, Scale } from '../contract';
import { palettes } from './palettes';
import { faces } from './faces';
import { scales } from './scales';
import { materials } from './materials';

export interface ThemePack {
  id: string;
  label: string;
  source: { name: string; url: string; referoId?: string };
  northStar: string;
  /** Rules from the source that the facets must keep. */
  keep: string[];
  facets: Facets;
}

function byId<T extends { id: string }>(list: readonly T[], id: string, kind: string): T {
  const found = list.find((x) => x.id === id);
  if (!found) throw new Error(`No ${kind} with id '${id}'`);
  return found;
}

function facets(palette: string, face: string, scale: string, material: string): Facets {
  return {
    palette: byId<Palette>(palettes, palette, 'palette'),
    faces: byId<Faces>(faces, face, 'faces'),
    scale: byId<Scale>(scales, scale, 'scale'),
    materials: byId<Materials>(materials, material, 'materials'),
  };
}

export const packs: ThemePack[] = [
  {
    id: 'yahaha-elektron',
    label: 'yahaha × Elektron',
    source: { name: 'Elektron', url: 'https://elektron.se', referoId: '362d9644-ce48-40af-8c2a-35753ec54b5e' },
    northStar: 'Digital console in midnight, lit by part colours.',
    keep: [
      'Pure black ground; flat panels; no gradients or soft shadows.',
      'Square corners everywhere except inputs.',
      'Readout face for numerals only.',
      'Part hues are categorical: one per part, never decoration.',
    ],
    facets: facets('push', 'elektron', 'compact', 'elektron'),
  },
  {
    id: 'yahaha-classic',
    label: 'yahaha classic',
    source: { name: 'Yahaha pre-minimalism UI', url: 'https://github.com/ryangavin/yahaha/tree/0dd53b6' },
    northStar: 'An anodised instrument: chassis, wells, raised keys and a glowing display glass.',
    keep: [
      'Barlow for body, Barlow Condensed for display and readouts.',
      'Engraved panel print: small, spaced capitals.',
      'Amber means selected, waiting for you, or focus.',
      'Depth from bevels and recessed wells, not flat fills.',
    ],
    facets: facets('classic', 'classic', 'compact', 'hardware'),
  },
  {
    id: 'yahaha-push',
    label: 'yahaha Push (as designed)',
    source: { name: 'yahaha Push boards', url: 'https://github.com/satoramoto/yahaha/tree/main/docs/design/push' },
    northStar: 'Push: black ground, no boxes, hairline headers, lit lamps.',
    keep: ['Selection is a solid block with dark text.', 'Lamps are 2px bars with bloom.', 'Inputs are an underline with a caret.'],
    facets: facets('push', 'push', 'compact', 'push'),
  },
  {
    id: 'elektron',
    label: 'Elektron',
    source: { name: 'Elektron', url: 'https://elektron.se', referoId: '362d9644-ce48-40af-8c2a-35753ec54b5e' },
    northStar: 'Digital console in midnight.',
    keep: ['Amber is an indicator only.', 'Off-white fill for the primary action.'],
    facets: facets('elektron', 'elektron', 'compact', 'elektron'),
  },
  {
    id: 'ableton',
    label: 'Ableton',
    source: { name: 'Ableton', url: 'https://ableton.com', referoId: '20bc0e09-9534-402e-8287-db5fafaf3c55' },
    northStar: 'High-contrast digital studio, illuminated by electric blue.',
    keep: ['Electric blue only for interactive elements.', 'Red and teal only for category tags.', '0px radius everywhere.'],
    facets: facets('ableton', 'ableton', 'regular', 'ableton'),
  },
  {
    id: 'linear',
    label: 'Linear',
    source: { name: 'Linear', url: 'https://linear.app', referoId: '554b801c-3b31-4086-a7e5-ae613cdd618b' },
    northStar: 'Midnight command center: layered dark surfaces, one lime accent.',
    keep: ['Lime only for the primary action.', 'Depth from surface layers, not big shadows.', '6px radius on controls and cards.'],
    facets: facets('linear', 'linear', 'compact', 'linear'),
  },
];
