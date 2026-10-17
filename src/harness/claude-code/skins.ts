// How a zen palette becomes a Claude Code skin (kit/skin.ts): the colours the kit draws with on
// the app surfaces. The terminal draws none of them (it draws each meaning in its theme key), so
// this maps only to what the desktop, VS Code and mobile panes take: #rrggbb text and fills.
//
// - The desktop gives a render hook no theme to read and draws one value on its light and dark
//   panes alike, so the skin comes from the palette's dark scheme (the kit's values are tuned on
//   the dark pane and read on the light one).
// - The states are the palette's own: ok ← success, warn ← warning, bad ← danger.
// - Live (blue), merged (purple) and the two chart tints (cyan, orchid) keep their hue: each is
//   the palette colour (accent, hues, roles, selected) nearest in OKLCH hue to the kit's own, a
//   colour with some chroma, each taken once.
// - Quantity ink (slate) is the palette's secondary text cooled a quarter towards live; the
//   ramps step each base darker, lighter and darkest.
// - The greys are the palette's secondary, muted and faint text.
// - A palette may carry tuning (TUNED): values the harness wears in place of the derived ones.
//   The `claude-code` palette's tuning keeps the kit's hand-picked shades, so the Claude Code pack
//   still draws awesome-claude's look exactly.
// - Every meaning keeps a value of its own (the terminal finds a meaning by its value), so a
//   collision is stepped apart by one unit (shared/color.ts `apart`).
//
// kit/skins.ts holds the result for every pack, as plain data a plugin carries; skins.test.ts
// checks it matches, and `npx tsx scripts/harness-skins.ts` writes it again.
import type { Palette } from '../../library/contract';
import { packs } from '../../library/themes/packs';
import { apart, chroma, fromOklch, hex, hue, hueDistance, mix, oklch } from '../shared/color';
import type { Skin } from './kit/skin';

/** The kit's own colour for each hue-kept meaning, whose hue a palette's pick stays nearest. */
const HUE_OF = {
  blue: hue('#6c8ef5'),
  purple: hue('#9d85e8'),
  cyan: hue('#4fb3c8'),
  orchid: hue('#c58ad6'),
} as const;

/** The least OKLCH chroma a colour needs to stand for a hue. */
const MIN_CHROMA = 0.06;

type Meaning = keyof typeof HUE_OF;
const MEANINGS = Object.keys(HUE_OF) as Meaning[];
/** How much each meaning's hue matters: the statuses more than the chart tints. */
const WEIGHT: Record<Meaning, number> = { blue: 2, purple: 1.5, cyan: 1, orchid: 1 };
/** The farthest (degrees) a palette colour may sit from a meaning's hue and still stand for it. */
const REACH = 45;

/**
 * Each meaning's palette colour: the assignment, each colour used once, with the least weighted
 * hue distance; a meaning with no colour within REACH gets none (it is made by rotating live).
 */
function assign(pool: readonly string[]): Partial<Record<Meaning, string>> {
  let best: { cost: number; pick: (number | null)[] } = { cost: Infinity, pick: [] };
  const walk = (i: number, pick: (number | null)[], used: Set<number>, cost: number) => {
    if (cost >= best.cost) return;
    if (i === MEANINGS.length) {
      best = { cost, pick: [...pick] };
      return;
    }
    const m = MEANINGS[i]!;
    for (const [j, c] of pool.entries()) {
      if (used.has(j)) continue;
      const d = hueDistance(hue(c), HUE_OF[m]);
      if (d > REACH) continue;
      used.add(j);
      walk(i + 1, [...pick, j], used, cost + d * WEIGHT[m]);
      used.delete(j);
    }
    walk(i + 1, [...pick, null], used, cost + REACH * WEIGHT[m]);
  };
  walk(0, [], new Set(), 0);
  return Object.fromEntries(best.pick.flatMap((j, i) => (j === null ? [] : [[MEANINGS[i]!, pool[j]!]])));
}

/** `base` turned to `toHue`, keeping its lightness and chroma. */
const rotate = (base: string, toHue: number): string => {
  const [l, c] = oklch(base);
  return fromOklch(l, Math.max(c, 0.1), toHue);
};

type Tuning = Partial<Omit<Skin, 'label'>>;

/** Values a palette wears in this harness in place of the derived ones, by palette id. */
export const TUNED: Readonly<Record<string, Tuning>> = {
  // The kit's hand-picked shades, from before it moved into zen (awesome-claude kit/tokens.ts).
  'claude-code': {
    purple: '#9d85e8',
    cyan: '#4fb3c8',
    slate: '#8c9bb5',
    orchid: '#c58ad6',
    ramp: {
      blue: ['#6c8ef5', '#4c68c9', '#a9bbf9', '#38509e'],
      slate: ['#8c9bb5', '#6f7c93', '#a7b2c6', '#5b667a'],
    },
    muted: '#8e8e93',
  },
  // The picks from before the contract's fifth hue joined the pool, so existing skins don't move
  // (the fifth hue sits nearer these meanings than the hue each skin was wearing).
  push: { orchid: '#f57aff' },
  classic: { blue: '#4cc2ff', cyan: '#08b7aa', slate: '#87aac2' },
  frost: { orchid: '#f2659f' },
  elektron: { orchid: '#ff3dbb' },
  linear: { orchid: '#ff7ad9' },
};

/** A base, then darker, lighter and darkest. */
const ramp = (base: string): [string, string, string, string] => [base, mix(base, '#000000', 0.25), mix(base, '#ffffff', 0.35), mix(base, '#000000', 0.45)];

/** The skin a palette gives the app surfaces. */
export function skinOf(palette: Palette, label: string = palette.label): Skin {
  const s = palette.dark;
  const tuned = TUNED[palette.id] ?? {};
  const ok = hex(tuned.ok ?? s.success);
  const warn = hex(tuned.warn ?? s.warning);
  const bad = hex(tuned.bad ?? s.danger);
  const states = new Set([ok, warn, bad]);
  // Candidates for the hue-kept meanings: the palette's coloured roles, each once.
  const pool = [...new Set([s.accent, ...s.hues, ...s.roles, s.selected].map(hex))].filter((c) => chroma(c) >= MIN_CHROMA && !states.has(c));
  const picked = assign(pool);
  const { blue, purple, cyan, orchid } = Object.fromEntries(
    MEANINGS.map((m) => [m, hex(tuned[m] ?? picked[m] ?? rotate(picked.blue ?? hex(s.accent), HUE_OF[m]))]),
  ) as Record<Meaning, string>;
  const gray = { light: hex(s.text[1]), mid: hex(s.text[2]), dark: hex(s.text[3]) };
  const slate = hex(tuned.slate ?? mix(gray.light, blue, 0.25));
  const derived: Omit<Skin, 'label'> = {
    ok,
    warn,
    bad,
    blue,
    purple,
    cyan,
    slate,
    orchid,
    ramp: tuned.ramp ?? { blue: ramp(blue), slate: ramp(slate) },
    muted: hex(tuned.muted ?? gray.mid),
    gray: tuned.gray ?? gray,
  };
  return { label, ...distinct(derived) };
}

/**
 * Each meaning's value its own: statuses first, then the chart shades, then the greys (which may
 * share one another's value, as they all mean "recede").
 */
function distinct(skin: Omit<Skin, 'label'>): Omit<Skin, 'label'> {
  const taken = new Set<string>();
  const own = (c: string) => {
    const v = apart(c, taken);
    taken.add(v);
    return v;
  };
  const ok = own(skin.ok);
  const warn = own(skin.warn);
  const bad = own(skin.bad);
  const blue = own(skin.blue);
  const purple = own(skin.purple);
  const cyan = own(skin.cyan);
  const orchid = own(skin.orchid);
  // A ramp's base is its meaning's own value; its other shades are the ramp's.
  const slate = own(skin.slate);
  const rampBlue: [string, string, string, string] = [blue, own(skin.ramp.blue[1]), own(skin.ramp.blue[2]), own(skin.ramp.blue[3])];
  const rampSlate: [string, string, string, string] = [slate, own(skin.ramp.slate[1]), own(skin.ramp.slate[2]), own(skin.ramp.slate[3])];
  const statusesAndShades = new Set(taken);
  const grey = (c: string) => apart(c, statusesAndShades);
  return {
    ok,
    warn,
    bad,
    blue,
    purple,
    cyan,
    slate,
    orchid,
    ramp: { blue: rampBlue, slate: rampSlate },
    muted: grey(skin.muted),
    gray: { light: grey(skin.gray.light), mid: grey(skin.gray.mid), dark: grey(skin.gray.dark) },
  };
}

/** Every pack's skin, by pack id, in the packs' order. */
export function packSkins(): Record<string, Skin> {
  return Object.fromEntries(packs.map((p) => [p.id, skinOf(p.facets.palette, p.label)]));
}

/** The skin the kit starts in. */
export const DEFAULT_SKIN = 'claude-code';

/** kit/skins.ts as it should read: every pack's skin as plain data. */
export function skinsSource(): string {
  const body = JSON.stringify(packSkins(), null, 2).replace(/"([a-z][a-zA-Z]*)":/g, '$1:');
  return `// Every zen theme pack's skin for the Claude Code kit, by pack id: made from the pack's palette by
// zen's src/harness/claude-code/skins.ts. Generated; don't edit it, run \`npx tsx scripts/harness-skins.ts\` in zen.
import type { Skin } from './skin'

export const SKINS = ${body} as const satisfies Record<string, Skin>

/** A pack's id: the skins a mod can wear. */
export type SkinId = keyof typeof SKINS

/** The skin the kit starts in: awesome-claude's look. */
export const DEFAULT_SKIN: SkinId = '${DEFAULT_SKIN}'
`;
}
