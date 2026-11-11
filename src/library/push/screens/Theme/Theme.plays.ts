// What each push-theme scenario does and checks. The words are in Theme.stories.tsx.
//
// A play is drawn in the pack and mode the Storybook toolbar gives it. Where a scenario names
// another pack or a mode, the play dresses the scope the way a theme scope does (the pack's
// contract values, and the display restating its dark ones), and puts back what was there.
// `node scripts/push-stories.mjs "Push/Screens/Theme" --theme <pack> --mode <mode>` draws the
// same plays in a real scope of any pack.
import { toCssVars, type Mode } from '../../../contract';
import { contrast } from '../../../foundation/skins/colour';
import { LAMPS, lampVar } from '../../../foundation/themes/lamps';
import { packs } from '../../../foundation/themes/packs';
import { initialState } from '../../model/state';
import type { PushState } from '../../model/types';
import { cell, display, expect, face, fillOf, given, GREY, groundOf, lamp, lampState, onTrack, pads, RED, rgbOf, tab, tableLamp, touching, wait, waitFor } from '../play';
import type { Play } from '../scenario';

const none = async () => {};
const withState = (more: Partial<PushState>) => ({ args: { initialState: { ...initialState(), ...more } } });
const scopeOf = (c: HTMLElement) => (c.closest<HTMLElement>('[data-mode]') ?? c.querySelector<HTMLElement>('[data-mode]'))!;
const pack = (id: string) => packs.find((p) => p.id === id)!;

/** Dress the scope in a pack and a mode, as a theme scope would. Returns how to put back what was there. */
async function wear(c: HTMLElement, id: string, mode: Mode): Promise<() => void> {
  const scope = scopeOf(c);
  const screen = display(c);
  const before = [scope.getAttribute('style'), scope.dataset.mode, screen.getAttribute('style')] as const;
  for (const [name, value] of Object.entries(toCssVars(pack(id).facets, mode))) scope.style.setProperty(name, value);
  scope.dataset.mode = mode;
  if (screen.dataset.dark) for (const [name, value] of Object.entries(toCssVars(pack(id).facets, 'dark'))) screen.style.setProperty(name, value);
  // Long enough for the caps to finish changing colour.
  await wait(450);
  return () => {
    scope.setAttribute('style', before[0] ?? '');
    scope.dataset.mode = before[1];
    screen.setAttribute('style', before[2] ?? '');
  };
}

const hex = ([r, g, b]: number[]) => `#${[r, g, b].map((n) => Math.round(n).toString(16).padStart(2, '0')).join('')}`;
const lightOf = ([r, g, b]: number[]) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
/** The contrast of a piece of text with what is behind it. */
const legibility = (text: Element, root: Element) => contrast(hex(rgbOf(getComputedStyle(text).color)), hex(groundOf(text, root)));
/** What the library asks of ink on its ground (WCAG AA), and of print that says a control cannot be pressed now. */
const AA = 4.5;
const UNAVAILABLE = 2;

/** Every legend and display text that falls short, as words. */
function illegible(c: HTMLElement): string[] {
  const scope = scopeOf(c);
  const short: string[] = [];
  for (const legend of c.querySelectorAll<HTMLElement>('.push-surface__cell[data-cap="legend"]')) {
    const text = legend.querySelector('[data-part="label"]');
    if (!text?.textContent?.trim()) continue;
    const need = legend.dataset.lamp === 'off' ? UNAVAILABLE : AA;
    const got = legibility(text, scope);
    if (got < need) short.push(`${legend.dataset.control} (${legend.dataset.lamp ?? 'no lamp'}) ${got.toFixed(2)} < ${need}`);
  }
  for (const text of display(c).querySelectorAll<HTMLElement>('[data-role]')) {
    if (!text.textContent?.trim() || text.closest('[data-disabled], [data-dim], [aria-hidden="true"]')) continue;
    const got = legibility(text, scope);
    if (got < AA) short.push(`display "${text.textContent.trim().slice(0, 16)}" ${got.toFixed(2)} < ${AA}`);
  }
  return short;
}

/** How solid a colour is, 0 to 1, whatever format the browser words it in. */
function alphaOf(colour: string): number {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 1;
  const context = canvas.getContext('2d', { willReadFrequently: true })!;
  context.fillStyle = colour;
  context.fillRect(0, 0, 1, 1);
  return context.getImageData(0, 0, 1, 1).data[3] / 255;
}
/** A pad's glow: the widest spread of light its face casts outward, and how strong it is. */
function glow(el: Element): { reach: number; strength: number } {
  let reach = 0;
  let strength = 0;
  for (const part of getComputedStyle(el).boxShadow.split(/,(?![^(]*\))/)) {
    if (/inset/.test(part)) continue;
    const colour = /[a-z]+\([^)]*\)/.exec(part)?.[0];
    const lengths = [...part.replace(colour ?? '', '').matchAll(/(-?[\d.]+)px/g)].map((m) => Number(m[1]));
    const blur = lengths[2] ?? 0;
    const alpha = colour ? alphaOf(colour) : 0;
    if (alpha > 0 && blur > reach) {
      reach = blur;
      strength = alpha;
    }
  }
  return { reach, strength };
}
const padsBy = (c: HTMLElement, state: string) => pads(c).filter((p) => p.dataset.lamp === state);

export const plays = {
  ThePackIsOffered: {
    act: none,
    check: ({ canvasElement: c }) => {
      // The picker and the inspector both read this list (ThemePicker.tsx, ThemeInspector.tsx).
      const offered = pack('push-3');
      expect(offered).toMatchObject({ label: 'Push 3', source: { name: 'Ableton Push 3 manual' } });
      expect(offered.source.url).toMatch(/^https:\/\/www\.ableton\.com\//);
      expect(offered.keep.length).toBeGreaterThanOrEqual(4);
      expect(offered.keep.join(' ')).toMatch(/black/);
      expect(offered.keep.join(' ')).toMatch(/display stays dark/);
      expect(packs.filter((p) => p.id === 'push-3')).toHaveLength(1);
      // And a scope can wear it: every contract value is there in both modes.
      for (const mode of ['dark', 'light'] as const) expect(Object.keys(toCssVars(offered.facets, mode))).toEqual(Object.keys(toCssVars(packs[0].facets, mode)));
      expect(scopeOf(c)).not.toBeNull();
    },
  },

  TheDeviceInItsOwnPack: {
    act: async ({ canvasElement: c }) => {
      (c as unknown as { off?: () => void }).off = await wear(c, 'push-3', 'dark');
    },
    check: ({ canvasElement: c }) => {
      const scope = scopeOf(c);
      // The body is black.
      expect(Math.max(...fillOf(c.querySelector('.push-surface__face')!))).toBeLessThan(16);
      // An unlit pad is see-through, and dark over the body.
      const unlit = face(c, padsBy(c, 'off')[0].dataset.control!);
      expect(getComputedStyle(unlit).backgroundColor).toMatch(/\/\s*0?\.\d+\)|,\s*0?\.\d+\)/);
      expect(lightOf(groundOf(unlit, scope))).toBeLessThan(60);
      expect(glow(unlit).reach).toBe(0);
      // A lit pad is its colour, with that colour's light around it.
      const lit = padsBy(c, 'lit').find((p) => !/white/.test(lamp(c, p.dataset.control!).colour))!;
      const fill = fillOf(face(c, lit.dataset.control!));
      expect(lightOf(fill)).toBeGreaterThan(lightOf(groundOf(unlit, scope)) + 60);
      expect(Math.max(...fill) - Math.min(...fill)).toBeGreaterThan(40);
      expect(glow(face(c, lit.dataset.control!)).reach).toBeGreaterThan(4);
      (c as unknown as { off: () => void }).off();
    },
  },

  TheContractCheck: {
    act: none,
    check: () => {
      // The check itself is the library's (`npx vitest run src/library/library.test.tsx`), which
      // scans the area's files. Here the same rule is put to the stylesheets as the page has them:
      // no rule of the area states a colour of its own.
      const literal = new RegExp(`(?:${['rg', 'hs'].map((f) => `${f}[bl]a?`).join('|')})\\(`);
      const mine: CSSStyleRule[] = [];
      const walk = (rules: CSSRuleList) => {
        for (const rule of rules) {
          if (rule instanceof CSSStyleRule && /\.push-/.test(rule.selectorText)) mine.push(rule);
          else if ('cssRules' in rule) walk((rule as CSSGroupingRule).cssRules);
        }
      };
      for (const sheet of document.styleSheets) {
        try {
          walk(sheet.cssRules);
        } catch {
          // A sheet from another origin (the fonts) cannot be read, and is not the area's.
        }
      }
      expect(mine.length).toBeGreaterThan(50);
      const coloured = mine.filter((rule) => literal.test(rule.style.cssText)).map((rule) => `${rule.selectorText} { ${rule.style.cssText} }`);
      expect(coloured).toEqual([]);
      // A radius is the contract's, or none.
      const radii = mine.map((rule) => rule.style.getPropertyValue('border-radius')).filter((v) => v && !/^var\(--radius-[a-z]+\)$/.test(v) && v !== '0px' && v !== 'inherit');
      expect(radii).toEqual([]);
    },
  },

  ALightPack: {
    act: async ({ canvasElement: c }) => {
      const before = { body: fillOf(c.querySelector('.push-surface__face')!), face: getComputedStyle(face(c, 'play')).fontFamily };
      const off = await wear(c, 'linear', 'light');
      Object.assign(c, { worn: { before, off } });
    },
    check: ({ canvasElement: c }) => {
      const scope = scopeOf(c);
      const { before, off } = (c as unknown as { worn: { before: { body: number[]; face: string }; off: () => void } }).worn;
      const vars = toCssVars(pack('linear').facets, 'light');
      // The body is the pack's ground, and a button its cap, with the pack's ink printed on it.
      const body = fillOf(c.querySelector('.push-surface__face')!);
      expect(body).toEqual(rgbOf(vars['--surface-0']));
      expect(lightOf(body)).toBeGreaterThan(180);
      expect(body).not.toEqual(before.body);
      const legend = face(c, 'play').querySelector('[data-part="label"]')!;
      expect(lightOf(rgbOf(getComputedStyle(legend).color))).toBeLessThan(lightOf(groundOf(legend, scope)) - 80);
      expect(getComputedStyle(face(c, 'play')).fontFamily).toBe(getComputedStyle(scope).getPropertyValue('--font-ui').trim() || getComputedStyle(face(c, 'play')).fontFamily);
      // A lit pad is still plainly not an unlit one.
      const unlit = groundOf(face(c, padsBy(c, 'off')[0].dataset.control!), scope);
      // (An empty step's grey is meant to be barely there: it is the coloured lamps that are asked about.)
      for (const lit of padsBy(c, 'lit').filter((p) => lamp(c, p.dataset.control!).colour !== GREY)) {
        const fill = groundOf(face(c, lit.dataset.control!), scope);
        const apart = Math.hypot(fill[0] - unlit[0], fill[1] - unlit[1], fill[2] - unlit[2]);
        expect(apart, `${lit.dataset.control} ${lamp(c, lit.dataset.control!).colour} ${fill} on ${unlit}`).toBeGreaterThan(70);
      }
      off();
    },
  },

  LegibleInEveryPack: {
    act: none,
    check: async ({ canvasElement: c }) => {
      // As drawn, in the pack and mode of the toolbar.
      expect(illegible(c).join('; ')).toBe('');
      // And dressed in each pack, light and dark.
      const short: string[] = [];
      for (const p of packs) {
        for (const mode of ['dark', 'light'] as const) {
          const off = await wear(c, p.id, mode);
          short.push(...illegible(c).map((line) => `${p.id} ${mode}: ${line}`));
          off();
        }
      }
      if (short.length) {
        // By pack, mode and what fell short, with the worst of each: the whole list is long.
        const worst = new Map<string, number>();
        for (const line of short) {
          const [, where, what, got] = /^(\S+ \S+): (display|\S+ \([^)]*\)).* ([\d.]+) < /.exec(line) ?? [];
          const key = `${where} ${what === 'display' ? 'display text' : `legend ${/\(([^)]*)\)/.exec(what)?.[1]}`}`;
          worst.set(key, Math.min(worst.get(key) ?? 99, Number(got)));
        }
        throw new Error(`${short.length} fall short: ${[...worst].map(([key, got]) => `${key} ${got}`).join('; ')}. For example: ${[...new Set(short.filter((l) => !/^visuals/.test(l)))].slice(0, 12).join('; ')}`);
      }
    },
  },

  ALightPackWithTheDefault: {
    act: async ({ canvasElement: c }) => {
      Object.assign(c, { off: await wear(c, 'push-3', 'light') });
    },
    check: ({ canvasElement: c }) => {
      // Around it the body is light.
      expect(lightOf(fillOf(c.querySelector('.push-surface__face')!))).toBeGreaterThan(180);
      expect(display(c)).toHaveAttribute('data-dark');
      const ground = lightOf(fillOf(display(c)));
      expect(ground).toBeLessThan(40);
      const name = tab(c, 'bottom', 2).querySelector('[data-part="label"]')!;
      expect(lightOf(rgbOf(getComputedStyle(name).color))).toBeGreaterThan(ground + 80);
      const value = display(c).querySelector('[data-part="value"]')!;
      expect(lightOf(rgbOf(getComputedStyle(value).color))).toBeGreaterThan(ground + 80);
      (c as unknown as { off: () => void }).off();
    },
  },

  ATrackColourByIndex: {
    // The bass track plays its root notes in its own colour: index 22 of the table.
    set: onTrack('t-bass'),
    act: none,
    check: ({ canvasElement: c }) => {
      const name = tab(c, 'bottom', 2);
      expect(name.style.getPropertyValue('--push-lamp')).toBe(lampVar(22));
      const root = pads(c).find((p) => lamp(c, p.dataset.control!).colour === tableLamp(22))!;
      expect(root).toBeDefined();
      // Both resolve to the table's twenty-third colour.
      const resolved = (el: Element) => getComputedStyle(el).getPropertyValue('--push-lamp').trim();
      expect(resolved(root)).toBe(resolved(name));
      expect(rgbOf(resolved(name))).toEqual(rgbOf(LAMPS[22]));
      // The Set held an index, never a colour.
      expect(typeof JSON.parse(JSON.stringify(22))).toBe('number');
    },
  },

  AnIndexOutsideTheTable: {
    set: (set) => void (set.tracks[1].colour = 999),
    act: none,
    check: ({ canvasElement: c }) => {
      const name = tab(c, 'bottom', 2);
      expect(name.style.getPropertyValue('--push-lamp')).toBe(lampVar(999));
      expect(lampVar(999)).toBe(lampVar(-1));
      expect(lampVar(999)).not.toBe(lampVar(0));
      const neutral = getComputedStyle(display(c)).getPropertyValue(lampVar(999).slice(4, -1)).trim();
      expect(neutral).not.toBe('');
      expect(rgbOf(getComputedStyle(name).getPropertyValue('--push-lamp').trim())).toEqual(rgbOf(neutral));
      // Its button is lit in it too.
      expect(lamp(c, 'lower-2').colour).toContain(lampVar(999));
    },
  },

  Choosing: {
    // Index 20 of the table is a teal.
    ...withState({ colourPick: { of: 'track', track: 't-bass' } }),
    set: (set) => void (set.tracks[1].colour = 20),
    act: none,
    check: ({ canvasElement: c }) => {
      const shown = pads(c).map((p) => ({ id: p.dataset.control!, ...lamp(c, p.dataset.control!) }));
      expect(shown).toHaveLength(64);
      // One colour of the table each, none twice.
      const index = (colour: string) => LAMPS.findIndex((_, i) => colour.includes(`${lampVar(i)})`) || colour.endsWith(lampVar(i)) || colour === lampVar(i) || colour.includes(`${lampVar(i)} `));
      const indexes = shown.map((p) => index(p.colour));
      expect(indexes.every((i) => i >= 0)).toBe(true);
      expect(new Set(indexes).size).toBe(64);
      // The teal one is marked: it alone is lit differently.
      const teal = shown[indexes.indexOf(20)];
      expect(teal).toBeDefined();
      const others = shown.filter((p) => p.id !== teal.id);
      expect(new Set(others.map((p) => p.state)).size).toBe(1);
      expect(teal.state).not.toBe(others[0].state);
    },
  },

  RecordingInAnotherPack: {
    set: (set) => void (set.transport.recording = 'session'),
    act: async ({ canvasElement: c }) => {
      const before = rgbOf(getComputedStyle(cell(c, 'record')).getPropertyValue('--push-lamp').trim());
      Object.assign(c, { worn: { before, off: await wear(c, 'big-red', 'dark') } });
    },
    check: ({ canvasElement: c }) => {
      const { before, off } = (c as unknown as { worn: { before: number[]; off: () => void } }).worn;
      expect(lamp(c, 'record')).toEqual({ state: 'lit', colour: RED });
      // The lamp names the meaning; the pack says what colour that is.
      const danger = rgbOf(toCssVars(pack('big-red').facets, 'dark')['--danger']);
      const now = rgbOf(getComputedStyle(cell(c, 'record')).getPropertyValue('--push-lamp').trim());
      expect(now).toEqual(danger);
      expect(now).not.toEqual(before);
      off();
    },
  },

  AMutedPadOfAnyColour: {
    // The second, third and fourth drum pads muted, and the three over them left plain in the same colours.
    set: (set) => {
      const kit = set.tracks[0].devices[0].pads!;
      [0, 14, 22].forEach((colour, i) => {
        Object.assign(kit[1 + i], { colour, muted: true });
        Object.assign(kit[5 + i], { colour, muted: false });
      });
    },
    act: none,
    check: ({ canvasElement: c }) => {
      [0, 14, 22].forEach((colour, i) => {
        const muted = `pad-8-${i + 2}`;
        const plain = `pad-7-${i + 2}`;
        // Its own colour, by the one rule for a darker version.
        expect(lamp(c, muted).colour).toBe(tableLamp(colour, 'dark'));
        expect(lamp(c, plain).colour).toBe(tableLamp(colour));
        const [dark, lit] = [fillOf(face(c, muted)), fillOf(face(c, plain))];
        expect(lightOf(dark)).toBeLessThan(lightOf(lit) * 0.75);
        // Darker, but still that colour: its strongest channel is the same one.
        expect(dark.indexOf(Math.max(...dark))).toBe(lit.indexOf(Math.max(...lit)));
      });
      const three = [2, 3, 4].map((n) => fillOf(face(c, `pad-8-${n}`)).join());
      expect(new Set(three).size).toBe(3);
    },
  },

  BloomFollowsBrightness: {
    act: async ({ canvasElement: c }) => {
      const lit = padsBy(c, 'lit')[0].dataset.control!;
      Object.assign(c, { before: { lit, light: lightOf(fillOf(face(c, lit))), glow: glow(face(c, lit)) } });
      await given(c, (set) => void (set.unit.ledBrightness = 30));
    },
    check: async ({ canvasElement: c }) => {
      const { lit, light, glow: before } = (c as unknown as { before: { lit: string; light: number; glow: { reach: number; strength: number } } }).before;
      expect(before.reach).toBeGreaterThan(0);
      await waitFor(() => expect(lightOf(fillOf(face(c, lit)))).toBeLessThan(light * 0.7));
      const after = glow(face(c, lit));
      expect(after.reach).toBeLessThan(before.reach * 0.5);
      expect(lampState(c, lit)).toBe('lit');
    },
  },

  ReducedMotion: {
    // A queued clip's pad blinks.
    ...withState({ pads: 'session' }),
    set: (set) => {
      set.transport.playing = true;
      set.tracks[0].clips[0]!.state = 'queued';
    },
    act: async () => {
      await wait(300);
    },
    check: async ({ canvasElement: c }) => {
      const pad = cell(c, 'pad-1-1');
      const steady = cell(c, 'pad-1-2');
      expect(pad.dataset.lamp).toBe('blink');
      expect(steady.dataset.lamp).toBe('lit');
      const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
      // The stylesheet's answer to the question is there whatever this system says.
      const marks: string[] = [];
      const walk = (rules: CSSRuleList, within: boolean) => {
        for (const rule of rules) {
          if (rule instanceof CSSMediaRule) walk(rule.cssRules, within || /prefers-reduced-motion:\s*reduce/.test(rule.conditionText));
          else if (within && rule instanceof CSSStyleRule && /\.push-surface__cell/.test(rule.selectorText)) marks.push(rule.selectorText);
        }
      };
      for (const sheet of document.styleSheets) {
        try {
          walk(sheet.cssRules, false);
        } catch {
          // Another origin's sheet.
        }
      }
      expect(marks.some((m) => /blink/.test(m) && /::after/.test(m))).toBe(true);
      expect(marks.some((m) => /pulse/.test(m) && !/blink/.test(m))).toBe(true);
      const surface = c.querySelector<HTMLElement>('.push-surface')!;
      const seen = new Set<string>();
      for (let i = 0; i < 12; i++) {
        seen.add(getComputedStyle(pad).opacity);
        await wait(90);
      }
      if (reduced) {
        // Still: the clock does not run, and the pad carries a dashed mark a lit pad does not.
        expect(surface.style.getPropertyValue('--push-blink')).toBe('');
        expect(seen.size).toBe(1);
        expect(getComputedStyle(pad, '::after').borderTopStyle).toBe('dashed');
        expect(getComputedStyle(steady, '::after').content).toBe('none');
      } else {
        // Moving: the lamp goes dark and comes back with the beat, and carries no mark.
        expect(seen.size).toBeGreaterThan(1);
        expect(getComputedStyle(pad, '::after').content).toBe('none');
      }
    },
  },

  ALargeValue: {
    act: async ({ canvasElement: c }) => {
      // Sizes in the display's own pixels (it is 960 of them wide), whatever size it is drawn at.
      const px = display(c).getBoundingClientRect().width / 960;
      const size = (col: number, part: string) => {
        const el = display(c).querySelector(`.push-display__cell[data-type="param"][data-col="${col}"] [data-part="${part}"]`);
        return el ? parseFloat(getComputedStyle(el).fontSize) / px : 0;
      };
      const plain = { value: size(2, 'value'), name: size(2, 'label') };
      await touching(c, 'encoder-2', async () => {
        await wait(60);
        Object.assign(c, { sizes: { plain, touched: { value: size(2, 'value'), name: size(2, 'name'), unit: size(2, 'unit') }, other: { value: size(3, 'value'), name: size(3, 'label') } } });
      });
    },
    check: ({ canvasElement: c }) => {
      const { plain, touched, other } = (c as unknown as { sizes: Record<'plain' | 'touched' | 'other', { value: number; name: number; unit?: number }> }).sizes;
      // The three sizes of the 160-pixel screen: label 12, value 15, large 26.
      expect(plain.value).toBeCloseTo(15, 0);
      expect(plain.name).toBeCloseTo(12, 0);
      expect(touched.value).toBeCloseTo(26, 0);
      expect(touched.name).toBeCloseTo(12, 0);
      // The untouched column beside it is as it was.
      expect(other).toEqual(plain);
      // Let go, it is the value size again.
      const px = display(c).getBoundingClientRect().width / 960;
      const now = display(c).querySelector('.push-display__cell[data-type="param"][data-col="2"] [data-part="value"]')!;
      expect(parseFloat(getComputedStyle(now).fontSize) / px).toBeCloseTo(15, 0);
    },
  },
} satisfies Record<string, Play>;
