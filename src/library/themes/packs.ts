import type { Facets } from '../contract';
import { ableton, elektron, linear, pushDark, pushLight } from './palettes';
import { abletonType, elektronType, linearType, pushType } from './types';
import { abletonChrome, elektronChrome, linearChrome, pushChrome } from './chromes';
import { compact, regular } from './densities';

export interface ThemePack {
  id: string;
  label: string;
  source: { name: string; url: string; referoId?: string };
  northStar: string;
  /** Rules from the source that the facets must keep. */
  keep: string[];
  facets: Facets;
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
    facets: { palette: pushDark, type: elektronType, chrome: elektronChrome, density: compact },
  },
  {
    id: 'yahaha-ableton-light',
    label: 'yahaha × Ableton (light)',
    source: { name: 'Ableton', url: 'https://ableton.com', referoId: '20bc0e09-9534-402e-8287-db5fafaf3c55' },
    northStar: 'High-contrast studio paper; ink, rules and part colours.',
    keep: ['Flat, square, ruled; no shadows.', 'No bloom in light: lamps are solid bars.'],
    facets: { palette: pushLight, type: elektronType, chrome: abletonChrome, density: compact },
  },
  {
    id: 'yahaha-push',
    label: 'yahaha Push (as designed)',
    source: { name: 'yahaha Push boards', url: 'https://github.com/satoramoto/yahaha/tree/main/docs/design/push' },
    northStar: 'Push: black ground, no boxes, hairline headers, lit lamps.',
    keep: ['Selection is a solid block with dark text.', 'Lamps are 2px bars with bloom.', 'Inputs are an underline with a caret.'],
    facets: { palette: pushDark, type: pushType, chrome: pushChrome, density: compact },
  },
  {
    id: 'elektron',
    label: 'Elektron',
    source: { name: 'Elektron', url: 'https://elektron.se', referoId: '362d9644-ce48-40af-8c2a-35753ec54b5e' },
    northStar: 'Digital console in midnight.',
    keep: ['Amber is an indicator only.', 'Off-white fill for the primary action.'],
    facets: { palette: elektron, type: elektronType, chrome: elektronChrome, density: compact },
  },
  {
    id: 'ableton',
    label: 'Ableton',
    source: { name: 'Ableton', url: 'https://ableton.com', referoId: '20bc0e09-9534-402e-8287-db5fafaf3c55' },
    northStar: 'High-contrast digital studio, illuminated by electric blue.',
    keep: ['Electric blue only for interactive elements.', 'Red and teal only for category tags.', '0px radius everywhere.'],
    facets: { palette: ableton, type: abletonType, chrome: abletonChrome, density: regular },
  },
  {
    id: 'linear',
    label: 'Linear',
    source: { name: 'Linear', url: 'https://linear.app', referoId: '554b801c-3b31-4086-a7e5-ae613cdd618b' },
    northStar: 'Midnight command center: layered dark surfaces, one lime accent.',
    keep: ['Lime only for the primary action.', 'Depth from surface layers, not big shadows.', '6px radius on controls and cards.'],
    facets: { palette: linear, type: linearType, chrome: linearChrome, density: compact },
  },
];
