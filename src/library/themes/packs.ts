import type { Faces, Facets, Materials, PackPrinciples, Palette, Scale } from '../contract';
import { palettes } from './palettes';
import { faces } from './faces';
import { scales } from './scales';
import { materials } from './materials';
import * as principles from './principles';

export interface ThemePack {
  id: string;
  label: string;
  source: { name: string; url: string; referoId?: string };
  northStar: string;
  /** Rules from the source that the facets must keep. */
  keep: string[];
  facets: Facets;
  /** How the system assembles a screen: the solver's principles (`themes/principles/`, `docs/assembly.md`). */
  principles: PackPrinciples;
  /** What stands behind a translucent ground in Storybook, in place of the real desktop the app
   *  composites over (a CSS background per mode). Omit for an opaque ground. */
  desktop?: { light: string; dark: string };
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
    principles: principles.yahaha,
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
    principles: principles.yahaha,
  },
  {
    id: 'yahaha-push',
    label: 'yahaha Push (as designed)',
    source: { name: 'yahaha Push boards', url: 'https://github.com/satoramoto/yahaha/tree/main/docs/design/push' },
    northStar: 'Push: black ground, no boxes, hairline headers, lit lamps.',
    keep: ['Selection is a solid block with dark text.', 'Lamps are 2px bars with bloom.', 'Inputs are an underline with a caret.'],
    facets: facets('push', 'push', 'compact', 'push'),
    principles: principles.yahaha,
  },
  {
    id: 'visuals',
    label: 'visual[flow] (glass)',
    source: { name: 'openflowfm/visuals 1.0', url: 'https://github.com/openflowfm/visuals' },
    northStar: 'An instrument under frosted glass: the desktop blurred through, areas parted by space and tone, controls set as type.',
    // added: a stand-in for macOS HUD frost over a wallpaper, so the glass has something to blur
    desktop: {
      dark: 'radial-gradient(120% 90% at 15% 10%, #3a3f4a 0%, transparent 55%), radial-gradient(90% 80% at 85% 90%, #2c2a33 0%, transparent 60%), #262628',
      light: 'radial-gradient(120% 90% at 15% 10%, #e8ebf2 0%, transparent 55%), radial-gradient(90% 80% at 85% 90%, #ece6ef 0%, transparent 60%), #dedede',
    },
    keep: [
      'Native HUD frost behind a transparent window; the page paints only faint tints over it (decision 69).',
      'Plain glass only on what floats: a thin tint over blur 20px (saturate 1.15), a light rim brighter along the top, a soft top highlight, a lift shadow; the shader glass adds light over it where WebGL allows.',
      'Near borderless: areas told apart by space and tone; the only lines are the selection ring, the focus ring and the playing mark (decision 68).',
      'Controls are type; the active one is underlined in the primary.',
      'Never translucency over the native preview: panels there are opaque (stage.css).',
      'Nothing animates: a panel shows or goes at once.',
      'Instrument Sans everywhere, numbers in tabular figures; captions at 4.5:1 or better.',
    ],
    facets: facets('frost', 'instrument', 'roomy', 'frost'),
    principles: principles.visuals,
  },
  {
    id: 'elektron',
    label: 'Elektron',
    source: { name: 'Elektron', url: 'https://elektron.se', referoId: '362d9644-ce48-40af-8c2a-35753ec54b5e' },
    northStar: 'Digital console in midnight.',
    keep: ['Amber is an indicator only.', 'Off-white fill for the primary action.'],
    facets: facets('elektron', 'elektron', 'compact', 'elektron'),
    principles: principles.studio,
  },
  {
    id: 'ableton',
    label: 'Ableton',
    source: { name: 'Ableton', url: 'https://ableton.com', referoId: '20bc0e09-9534-402e-8287-db5fafaf3c55' },
    northStar: 'High-contrast digital studio, illuminated by electric blue.',
    keep: ['Electric blue only for interactive elements.', 'Red and teal only for category tags.', '0px radius everywhere.'],
    facets: facets('ableton', 'ableton', 'regular', 'ableton'),
    principles: principles.studio,
  },
  {
    id: 'linear',
    label: 'Linear',
    source: { name: 'Linear', url: 'https://linear.app', referoId: '554b801c-3b31-4086-a7e5-ae613cdd618b' },
    northStar: 'Midnight command center: layered dark surfaces, one lime accent.',
    keep: ['Lime only for the primary action.', 'Depth from surface layers, not big shadows.', '6px radius on controls and cards.'],
    facets: facets('linear', 'linear', 'compact', 'linear'),
    principles: principles.studio,
  },
  {
    id: 'claude-code',
    label: 'Claude Code',
    source: { name: 'awesome-claude mods (the Claude Code pane)', url: 'https://github.com/satoramoto/awesome-claude' },
    northStar: 'An instrument inspector in the Claude Code pane: header rows, readings under them, one colour per meaning.',
    keep: [
      'One colour, one meaning: green finished, amber near a limit, red failed, blue live, purple merged, slate how much.',
      'Collapsible header rows with readings indented under them, on quiet rounded fills; an accent stripe tells sections apart. No bubbles or outlines.',
      'Bars are thin and flat, rounded only by their end caps.',
      'The terminal draws each meaning in its theme key, never a fixed colour (docs/harness-claude-code.md).',
    ],
    // The harness draws only the palette (the engine sets the type and draws the controls); the
    // other facets dress zen's own components in this pack.
    facets: facets('claude-code', 'linear', 'compact', 'linear'),
    principles: principles.studio,
  },
  {
    id: 'big-red',
    label: 'Big Red (panel)',
    source: { name: 'Big Red stage panel', url: 'https://github.com/ryangavin/big-red-synth' },
    northStar: 'A red stage-keyboard panel: printed labels, rubber keys, lit LEDs, a glass OLED.',
    keep: [
      'The chassis is saturated red; labels are printed on it in cream condensed capitals.',
      'Keys are dark rubber, caps matte black plastic, grooves recessed charcoal: depth from bevels and insets.',
      'State is a lit LED that blooms; a red LED means selected.',
      'Readouts sit behind one near-black glass OLED.',
    ],
    // Barlow Condensed in spaced bold capitals already reads as panel print.
    facets: facets('big-red', 'classic', 'compact', 'panel'),
    principles: principles.studio,
  },
];
