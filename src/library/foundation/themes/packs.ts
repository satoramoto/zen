import type { Faces, Facets, Materials, PackPrinciples, Palette, Scale } from '../../contract';
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
    id: 'push-3',
    label: 'Push 3',
    source: { name: 'Ableton Push 3 manual', url: 'https://www.ableton.com/en/push/manual/' },
    northStar: 'The unit itself: a matte black body, white print, a dark display, and light only where a lamp is lit.',
    keep: [
      'The body is black and matte; nothing on it is boxed.',
      'A legend is white print, dim until its control is available and bright when it is lit.',
      'Colour comes only from lamps: a pad, a button or the display, never the body.',
      'The display stays dark with white type in either mode.',
      'A lit lamp spills a little light; an unlit one is flat.',
    ],
    facets: facets('push-3', 'push-3', 'compact', 'push-3'),
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
      'The chassis is saturated red; labels are printed in cream condensed capitals.',
      'Each section sits on a slate-grey plate with a pale top edge; a plate on a plate is a lighter slate.',
      'Keys are dark rubber, caps matte black plastic, grooves recessed charcoal: depth from bevels and insets.',
      'State is a lit LED that blooms: a pure red LED means selected, a lime-green LED success.',
      'Readouts sit behind one near-black glass OLED; OLED type is role 2 ice white on screen black.',
    ],
    // Barlow Condensed in spaced bold capitals already reads as panel print.
    facets: facets('big-red', 'classic', 'compact', 'panel'),
    principles: principles.studio,
  },
  {
    id: 'mixflow', label: 'mix[flow]',
    source: { name: 'openflowfm/widgets (Current favorite)', url: 'https://github.com/openflowfm/widgets' },
    northStar: 'The original dense four-deck instrument, not a restyled approximation.',
    keep: [
      'DEFAULT_THEME is PRESETS[0], Current favorite: neutral primary, green signal, six independent source identities, two related deck families.',
      'Opaque near-black surfaces, one-pixel edges and 2px rectangular corners; no gradients, bevels or bloom added to controls.',
      'Self-hosted Recursive: MONO 1 for readings, MONO 0 for labels, CASL 0.38 in both.',
      '8/9/10/11/12/14/18px type, 22px toolbar controls, 2px gaps and 8px widget insets.',
      'Reference family colours remain exact instrument roles rather than being spread apart to redesign their palette.',
    ],
    facets: facets('mixflow', 'mixflow', 'mixflow', 'mixflow'),
    // added: generic assembled screens retain their 24px target floor. Music's faithful
    // dense geometry is an explicit role in this same scale facet, not a second theme.
    principles: { minTarget: 24, density: 'dense', gaps: { body: 1, group: 1 }, notes: [
      'The source is a dense desktop mixer: preserve its anatomical grid, small reading windows, and grouped controls.',
      'Scroll the four-deck face when narrow; do not shrink targets or omit instrument controls.',
    ] },
  },
  {
    id: 'textbook-console',
    label: 'Textbook console',
    source: { name: 'Midjourney', url: 'https://midjourney.com', referoId: '1e85631f-1e2e-41fa-a5dc-b1604bdbe25a' },
    northStar: 'A research console in a bioluminescent void: mono headings at whisper weight, prose in a narrow column, controls as faintly glowing specimens.',
    keep: [
      'The ground is a violet-black void, never pure black; prose sits on it directly, with no card behind it.',
      'Headings and labels are monospace at weight 400 even at display size; nothing bold.',
      'One blue for links and the thing in hand; the state triad (green, amber, red) is a closed set of translucent tints.',
      'Pills are fully round, cards 8px; what is raised glows faintly rather than casting a shadow.',
    ],
    facets: facets('console', 'console', 'airy', 'console'),
    principles: principles.textbook,
  },
  {
    id: 'textbook-blueprint',
    label: 'Textbook blueprint',
    source: { name: 'Timescale, with 19–86', url: 'https://www.timescale.com', referoId: '520e6739-69c0-4c16-a3ce-1c891c8c77c6' },
    northStar: 'An industrial blueprint on warm paper: a monumental light numeral, ink rules, one vermilion for titles and figure numbers, one yellow for the thing you act on, hard offset shadows.',
    keep: [
      'Depth is a hard offset shadow in the ink, never a soft blur; everything else is flat on paper.',
      'Vermilion only for titles, figure numbers and the numeral; yellow only for what you act on.',
      'Rules are 1px: a stone hairline inside the page, the ink for a card edge or a ledger row.',
      'Text is a serif for reading and a grotesque for everything else; the numeral is the grotesque at its lightest.',
    ],
    facets: facets('blueprint', 'blueprint', 'airy', 'blueprint'),
    principles: principles.textbook,
  },
];
