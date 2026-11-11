// What each push-display scenario does and checks. The words are in Display.stories.tsx.
import { lampVar } from '../../../foundation/themes/lamps';
import { project } from '../../model/project';
import { param, sampleSet } from '../../model/sample';
import { initialState } from '../../model/state';
import { NOTICE_MS } from '../../model/timing';
import type { PushSet, PushState, Screen, Track } from '../../model/types';
import { all, app, asked, bodyTexts, cell, click, column, columns, display, expect, fillOf, given, go, lamp, lampState, lists, onTrack, overlay, paramText, press, rgbOf, rowTexts, screenKind, screenText, tab, tableLamp, touching, wait, waitFor } from '../play';
import type { Play } from '../scenario';

const none = async () => {};
const withState = (more: Partial<PushState>) => ({ args: { initialState: { ...initialState(), ...more } } });
const inSetup = (tab = 0) => withState({ display: 'setup', setup: { tab, highlight: 0 } });
/** What the device shows first over the sample Set: the description an app would hand a display. */
const firstScreen = (): Screen => project(initialState(), sampleSet()).screen;
const labels = (row: Screen['top']) => row.map((c) => c?.label ?? '');
const middle = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.left + r.width / 2;
};
const lampOf = (el: HTMLElement | null) => el?.style.getPropertyValue('--push-lamp') ?? '';
const paramCells = (c: HTMLElement) => [...display(c).querySelectorAll<HTMLElement>('.push-display__cell[data-type="param"]')];
/** A text entry over the Set Library, as renaming a Set would open. */
const typing = (text: string, highlighted: number): Partial<PushState> => ({ display: 'sets', sets: { highlight: 1, sort: 'date' }, textEntry: { title: 'Rename', text, highlighted, then: { kind: 'edit', action: 'rename-set', set: 'set-2' } } });
/** Give a Set `n` return tracks, with a send on every track for each. */
const returns = (n: number) => (set: PushSet) => {
  const base = set.returns[0];
  set.returns = Array.from({ length: n }, (_, i): Track => ({ ...base, id: `r-${i}`, name: `${'ABCDEFGH'[i]} Return`, devices: [], volume: { ...base.volume, id: `r-${i}.volume` }, pan: { ...base.pan, id: `r-${i}.pan` } }));
  for (const t of set.tracks) t.sends = set.returns.map((r, i) => param(`${t.id}.send${i}`, r.name, 0.1 * i, `${-40 + i} dB`));
};
const bassBank = (change: (track: Track) => void) => onTrack('t-bass', (set) => change(set.tracks[1]));
/** The parameter cell that starts at a column. */
const pcell = (c: HTMLElement, col: number) => display(c).querySelector<HTMLElement>(`.push-display__cell[data-type="param"][data-col="${col}"]`)!;
/** A row's names, without their icons. */
const names = (c: HTMLElement, row: 'top' | 'bottom') => [1, 2, 3, 4, 5, 6, 7, 8].map((col) => (tab(c, row, col).querySelector('[data-part="label"]')?.textContent ?? '').trim());
const arcLength = (c: HTMLElement, col: number) => (pcell(c, col).querySelector('[data-part="arc"]') as SVGPathElement | null)?.getTotalLength() ?? 0;

export const plays = {
  AColumnIsAnEighth: {
    act: none,
    check: ({ canvasElement: c }) => {
      const width = display(c).getBoundingClientRect().width;
      for (const row of ['top', 'bottom'] as const) {
        for (let col = 1; col <= 8; col++) {
          const box = tab(c, row, col).getBoundingClientRect();
          expect(Math.abs(box.width - width / 8)).toBeLessThan(width / 100);
          // Its encoder is over it, and its buttons are in line.
          expect(Math.abs(middle(tab(c, row, col)) - middle(cell(c, `encoder-${col}`)))).toBeLessThan(width / 32);
          expect(Math.abs(middle(tab(c, row, col)) - middle(cell(c, `${row === 'top' ? 'upper' : 'lower'}-${col}`)))).toBeLessThan(width / 32);
        }
      }
      for (const el of paramCells(c)) expect(Math.abs(el.getBoundingClientRect().width - width / 8)).toBeLessThan(width / 100);
    },
  },

  ScalingKeepsThePixelGrid: {
    args: { part: 'display', screen: firstScreen() },
    act: async ({ canvasElement: c }) => {
      const measure = () => {
        const d = display(c).getBoundingClientRect();
        const parts = [...display(c).querySelectorAll<HTMLElement>('.push-display__tab, .push-display__cell, [data-part="value"], [data-part="label"]')];
        return { width: d.width, // A column or a cell by its box; a piece of text by where it starts and its line (glyph widths round at small sizes).
          boxes: parts.map((el) => { const r = el.getBoundingClientRect(); return el.dataset.part ? [r.left - d.left, r.top - d.top, r.height] : [r.left - d.left, r.top - d.top, r.width, r.height]; }), type: parts.filter((el) => el.dataset.part).map((el) => parseFloat(getComputedStyle(el).fontSize)) };
      };
      const holder = display(c).parentElement!;
      holder.style.width = '50%';
      await wait(50);
      const small = measure();
      holder.style.width = '100%';
      await wait(50);
      (c as unknown as { measured: unknown }).measured = { small, large: measure() };
    },
    check: ({ canvasElement: c }) => {
      const { small, large } = (c as unknown as { measured: { small: { width: number; boxes: number[][]; type: number[] }; large: { width: number; boxes: number[][]; type: number[] } } }).measured;
      expect(small.width).toBeGreaterThan(0);
      expect(large.width / small.width).toBeCloseTo(2, 2);
      expect(large.boxes).toHaveLength(small.boxes.length);
      // Every part is in the same place, twice the size: nothing wrapped or moved.
      small.boxes.forEach((box, i) => box.forEach((n, k) => expect(Math.abs(large.boxes[i][k] - n * 2)).toBeLessThan(1.5)));
      small.type.forEach((size, i) => expect(large.type[i]).toBeCloseTo(size * 2, 0));
    },
  },

  AScreenFromJSON: {
    args: { part: 'display', screen: JSON.parse(JSON.stringify(firstScreen())) as Screen },
    act: none,
    check: ({ canvasElement: c }) => {
      const screen = firstScreen();
      // Nothing is lost in the writing: the description is plain data.
      expect(JSON.parse(JSON.stringify(screen))).toEqual(screen);
      expect(screenKind(c)).toBe(screen.kind);
      expect(names(c, 'top')).toEqual(labels(screen.top));
      expect(names(c, 'bottom')).toEqual(labels(screen.bottom));
      const params = screen.body.flatMap((b) => (b.type === 'param' ? [b] : []));
      expect(paramCells(c)).toHaveLength(params.length);
      for (const p of params) expect(paramText(c, p.col)).toContain(p.name);
    },
  },

  TheDisplayAlone: {
    args: { part: 'display', screen: firstScreen() },
    act: none,
    check: ({ canvasElement: c }) => {
      const screen = firstScreen();
      expect(c.querySelector('.push-surface')).toBeNull();
      expect(c.querySelectorAll('[data-control]')).toHaveLength(0);
      // The same rows and columns the device shows first.
      expect(screenKind(c)).toBe('device');
      expect(names(c, 'bottom')).toEqual(labels(screen.bottom));
      expect(names(c, 'bottom').slice(0, 3)).toEqual(['Drums', 'Bass', 'Keys']);
      expect(paramText(c, 1)).toContain('Kick Tune');
      expect(tab(c, 'bottom', 1)).toHaveAttribute('data-selected');
      const box = display(c).getBoundingClientRect();
      expect(box.width / box.height).toBeCloseTo(6, 1);
    },
  },

  ATracksButtonWearsItsColour: {
    // Index 0 of the table is its pink.
    set: (set) => void (set.tracks[1].colour = 0),
    act: none,
    check: ({ canvasElement: c }) => {
      expect(lampOf(tab(c, 'bottom', 2))).toBe(lampVar(0));
      expect(lamp(c, 'lower-2')).toEqual({ state: 'lit', colour: tableLamp(0, 'dim') });
      // Its neighbour wears its own.
      expect(lamp(c, 'lower-3').colour).not.toBe(lamp(c, 'lower-2').colour);
    },
  },

  NothingToPress: {
    act: async ({ canvasElement: c }) => {
      expect(rowTexts(c, 'top')[6]).toBe('');
      await press(c, 'upper-7');
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(tab(c, 'top', 7)).toHaveAttribute('data-empty');
      expect(lampState(c, 'upper-7')).toBe('off');
      expect(asked(context)).toEqual([]);
      // A column with something in it is lit.
      expect(lampState(c, 'upper-1')).not.toBe('off');
    },
  },

  TheSelectedTrack: {
    // Tracks 3 and 4 share a colour, so the block and the text can be compared.
    set: onTrack('t-sampler', (set) => void (set.tracks[2].colour = set.tracks[3].colour)),
    act: none,
    check: ({ canvasElement: c }) => {
      const selected = tab(c, 'bottom', 4);
      expect(selected).toHaveAttribute('data-selected');
      for (const col of [1, 2, 3, 5, 6, 7, 8]) expect(tab(c, 'bottom', col)).not.toHaveAttribute('data-selected');
      // A solid block of the colour its neighbour's name is written in.
      const name = (col: number) => rgbOf(getComputedStyle(tab(c, 'bottom', col).querySelector('[data-part="label"]')!).color);
      expect(fillOf(selected)).toEqual(name(3));
      expect(name(4)).not.toEqual(name(3));
      expect(getComputedStyle(tab(c, 'bottom', 3)).backgroundColor).not.toBe(getComputedStyle(selected).backgroundColor);
      expect(name(2)).not.toEqual(name(3));
    },
  },

  AContinuousParameter: {
    set: bassBank((track) => {
      const bank = track.devices[0].banks[0];
      bank.parameters[3] = param('d-bass.freq', 'Frequency', 1, '20.0 kHz');
      bank.parameters[4] = param('d-bass.half', 'Half', 0.5, '50 %');
    }),
    act: none,
    check: ({ canvasElement: c }) => {
      const knob = pcell(c, 4).querySelector('[aria-roledescription="knob"]')!;
      expect(knob).toHaveAccessibleName('Frequency 20.0 kHz');
      // Its name, then its reading (the number large, the unit small beside it), then the dial.
      expect(pcell(c, 4).querySelector('[data-part="name"]')).toHaveTextContent('Frequency');
      expect(pcell(c, 4).querySelector('[data-part="value"]')).toHaveTextContent('20.0');
      expect(pcell(c, 4).querySelector('[data-part="unit"]')).toHaveTextContent('kHz');
      const tops = ['name', 'reading'].map((part) => pcell(c, 4).querySelector(`[data-part="${part}"]`)!.getBoundingClientRect().top);
      expect(tops[0]).toBeLessThan(tops[1]);
      expect(tops[1]).toBeLessThan(knob.getBoundingClientRect().top);
      // At the top of its range the arc is whole: twice the one at half way.
      expect(arcLength(c, 4)).toBeGreaterThan(0);
      expect(arcLength(c, 4) / arcLength(c, 5)).toBeCloseTo(2, 1);
    },
  },

  AChoice: {
    // The LFO bank, with nothing drawn over its columns.
    ...withState({ device: { ...initialState().device, banks: { 'd-bass': 3 } } }),
    set: bassBank((track) => {
      const bank = track.devices[0].banks[3];
      delete bank.drawing;
      bank.parameters[0] = { id: 'd-bass.lshape', name: 'Shape', value: 2 / 3, display: 'Saw', kind: 'choice', choices: ['Sine', 'Triangle', 'Saw', 'Square'] };
    }),
    act: none,
    check: ({ canvasElement: c }) => {
      const shape = pcell(c, 1);
      expect(shape).toHaveAttribute('data-style', 'choice');
      expect(shape.querySelector('[data-part="name"]')).toHaveTextContent('Shape');
      const rows = [...shape.querySelectorAll<HTMLElement>('.yh-folder-list__row')];
      expect(rows.map((r) => r.textContent?.trim())).toEqual(['Sine', 'Triangle', 'Saw', 'Square']);
      expect(rows.filter((r) => r.getAttribute('aria-current') === 'true').map((r) => r.textContent?.trim())).toEqual(['Saw']);
    },
  },

  ABipolarValue: {
    ...withState({ display: 'mix', mix: { mode: 'track', parameter: 0, page: 0 } }),
    set: onTrack('t-bass', (set) => void Object.assign(set.tracks[1].pan, { value: 0.5, display: 'C' })),
    act: none,
    check: async ({ canvasElement: c }) => {
      expect(paramText(c, 2)).toContain('Pan');
      expect(pcell(c, 2).querySelector('[data-part="value"]')).toHaveTextContent('C');
      // Nothing is lit either side of the centre; off centre, an arc runs from the middle.
      expect(arcLength(c, 2)).toBeLessThan(1);
      await given(c, (set) => void Object.assign(set.tracks[1].pan, { value: 0.75, display: '25R' }));
      await waitFor(() => expect(arcLength(c, 2)).toBeGreaterThan(5));
      expect(pcell(c, 2).querySelector('[data-part="value"]')).toHaveTextContent('25R');
    },
  },

  TouchAndRelease: {
    act: async ({ canvasElement: c }) => {
      const plain = getComputedStyle(pcell(c, 2)).backgroundColor;
      await touching(c, 'encoder-2', async () => {
        cell(c, 'encoder-2').dataset.marked = String(pcell(c, 2).hasAttribute('data-touched'));
        cell(c, 'encoder-2').dataset.differs = String(getComputedStyle(pcell(c, 2)).backgroundColor !== plain || getComputedStyle(pcell(c, 2)).boxShadow !== 'none' || getComputedStyle(pcell(c, 2)).outlineStyle !== 'none');
      });
    },
    check: ({ canvasElement: c }) => {
      expect(cell(c, 'encoder-2').dataset.marked).toBe('true');
      expect(cell(c, 'encoder-2').dataset.differs).toBe('true');
      expect(column(c, 2)).not.toHaveAttribute('data-touched');
    },
  },

  AnOscillatorShapeAcrossFourColumns: {
    set: bassBank((track) => void (track.devices[0].banks[0].drawing = { kind: 'oscillator', col: 2, span: 4, label: 'Oscillator', points: [[0, 0.5], [0.25, 1], [0.5, 0.5], [0.75, 0], [1, 0.5]] })),
    act: none,
    check: ({ canvasElement: c }) => {
      const drawing = display(c).querySelector<HTMLElement>('.push-display__cell[data-type="trace"]')!;
      expect(drawing).toHaveAttribute('data-col', '2');
      expect(drawing).toHaveAttribute('data-span', '4');
      const width = display(c).getBoundingClientRect().width;
      expect(drawing.getBoundingClientRect().width).toBeCloseTo(width / 2, -1);
      expect(Math.abs(drawing.getBoundingClientRect().left - tab(c, 'top', 2).getBoundingClientRect().left)).toBeLessThan(width / 100);
      // The parameters under it keep a column each, named over the drawing.
      const params = paramCells(c);
      expect(params.map((p) => p.dataset.col)).toEqual(['1', '2', '3', '4', '5', '6', '7', '8']);
      expect(params.every((p) => p.dataset.span === '1')).toBe(true);
      for (const col of [2, 3, 4, 5]) {
        const name = display(c).querySelector<HTMLElement>(`.push-display__cell[data-type="param"][data-col="${col}"] [data-part="label"], .push-display__cell[data-type="param"][data-col="${col}"] [data-part="name"]`)!;
        expect(Math.abs(middle(name) - middle(tab(c, 'top', col)))).toBeLessThan(width / 16);
        expect(name.getBoundingClientRect().top).toBeLessThanOrEqual(drawing.getBoundingClientRect().bottom);
      }
    },
  },

  ADeviceOnAGreenTrack: {
    // Index 19 of the table is a green.
    set: onTrack('t-bass', (set) => void (set.tracks[1].colour = 19)),
    act: none,
    check: ({ canvasElement: c }) => {
      const cells = paramCells(c);
      expect(cells.length).toBe(8);
      for (const el of cells) expect(lampOf(el)).toBe(lampVar(19));
      // The arc and the reading are drawn in it: green is their strongest part.
      const arc = rgbOf(getComputedStyle(pcell(c, 4).querySelector('[data-part="arc"]')!).stroke);
      expect(arc[1]).toBeGreaterThan(arc[0]);
      expect(arc[1]).toBeGreaterThan(arc[2]);
      const value = rgbOf(getComputedStyle(pcell(c, 4).querySelector('[data-part="value"]')!).color);
      expect(value[1]).toBeGreaterThan(value[0]);
      expect(value[1]).toBeGreaterThan(value[2]);
    },
  },

  Setup: {
    ...inSetup(),
    act: none,
    check: ({ canvasElement: c }) => {
      expect(screenKind(c)).toBe('setup');
      for (const el of paramCells(c)) expect(lampOf(el)).toBe('');
      // White on black: no track's colour.
      const value = rgbOf(getComputedStyle(pcell(c, 3).querySelector('[data-part="value"]')!).color);
      expect(Math.min(...value)).toBeGreaterThan(200);
      expect(Math.max(...value) - Math.min(...value)).toBeLessThan(16);
      const ground = fillOf(display(c));
      expect(Math.max(...ground)).toBeLessThan(40);
    },
  },

  AMutedDevice: {
    set: onTrack('t-bass', (set) => void (set.tracks[1].devices[0].on = false)),
    act: none,
    check: ({ canvasElement: c }) => {
      const cells = paramCells(c);
      expect(cells.length).toBe(8);
      for (const el of cells) expect(el).toHaveAttribute('data-disabled');
      // Grey: no stronger in one channel than another.
      const value = rgbOf(getComputedStyle(pcell(c, 4).querySelector('[data-part="value"]')!).color);
      expect(Math.max(...value) - Math.min(...value)).toBeLessThan(24);
    },
  },

  ChoosingATab: {
    ...inSetup(),
    act: async ({ canvasElement: c }) => {
      expect(tab(c, 'bottom', 1)).toHaveAttribute('data-selected');
      await press(c, 'lower-4');
    },
    check: ({ canvasElement: c }) => {
      expect(rowTexts(c, 'bottom')[3]).toBe('Audio');
      expect(tab(c, 'bottom', 4)).toHaveAttribute('data-selected');
      expect(tab(c, 'bottom', 1)).not.toHaveAttribute('data-selected');
      expect(paramText(c, 1)).toContain('Sample Rate');
      expect(getComputedStyle(tab(c, 'bottom', 4)).backgroundColor).not.toBe(getComputedStyle(tab(c, 'bottom', 1)).backgroundColor);
    },
  },

  ATabWithNews: {
    ...inSetup(),
    act: async ({ canvasElement: c }) => {
      expect(rowTexts(c, 'bottom')[7]).toBe('Software');
      await given(c, (set) => void (set.unit.software.update = { version: '12.4', state: 'available' }));
    },
    check: async ({ canvasElement: c }) => {
      await waitFor(() => expect(rowTexts(c, 'bottom')[7]).toBe('Software*'));
      expect(rowTexts(c, 'bottom').slice(0, 7).join('')).not.toContain('*');
    },
  },

  SevenSends: {
    ...withState({ display: 'mix' }),
    set: returns(7),
    act: async ({ canvasElement: c }) => {
      cell(c, 'upper-8').dataset.before = rowTexts(c, 'top').join('|');
      cell(c, 'upper-8').dataset.arrow = tab(c, 'top', 8).querySelector('[role="img"]')?.getAttribute('aria-label') ?? '';
      await press(c, 'upper-8');
    },
    check: ({ canvasElement: c }) => {
      expect(cell(c, 'upper-8').dataset.before).toBe('Volumes|Pans|A Return|B Return|C Return|D Return|E Return|›');
      expect(cell(c, 'upper-8').dataset.arrow).toBe('more to the right');
      expect(rowTexts(c, 'top')).toContain('F Return');
      expect(rowTexts(c, 'top')).toContain('G Return');
    },
  },

  ASubMenu: {
    act: async ({ canvasElement: c }) => {
      await press(c, 'add');
      await click(c, 'jog');
    },
    check: ({ canvasElement: c }) => {
      const shown = lists(c);
      expect(shown).toHaveLength(2);
      expect(shown[0]).toMatchObject({ rows: ['Device', 'MIDI Track', 'Audio Track', 'Return Track'], chosen: 'Device', enclosing: true });
      expect(shown[1].rows).toContain('Sounds');
      expect(shown[1].rows).toContain('Drums');
      const boxes = [...display(c).querySelectorAll<HTMLElement>('.push-display__cell[data-type="list"]')].map((el) => el.getBoundingClientRect());
      expect(boxes[1].left).toBeGreaterThanOrEqual(boxes[0].right - 1);
    },
  },

  ALongList: {
    ...withState({ display: 'browse', browse: { path: ['device'], highlight: 0, places: {} } }),
    act: async ({ canvasElement: c }) => {
      const rows = app(c).getSet().browser.roots[0].children!;
      cell(c, 'dpad-down').dataset.first = lists(c).at(-1)!.rows[0];
      cell(c, 'dpad-down').dataset.shown = String(lists(c).at(-1)!.rows.length);
      cell(c, 'dpad-down').dataset.total = String(rows.length);
      cell(c, 'dpad-down').dataset.lastName = rows.at(-1)!.name;
      for (let i = 1; i < rows.length; i++) await go(c, 'down');
    },
    check: ({ canvasElement: c }) => {
      const data = cell(c, 'dpad-down').dataset;
      // More rows than the display has lines.
      expect(Number(data.total)).toBeGreaterThan(Number(data.shown));
      const list = lists(c).at(-1)!;
      expect(list.chosen).toBe(data.lastName);
      expect(list.rows).toContain(data.lastName);
      expect(list.rows).not.toContain(data.first);
      const row = [...display(c).querySelectorAll<HTMLElement>('.yh-folder-list__row')].find((r) => r.getAttribute('aria-current') === 'true')!;
      expect(row.getBoundingClientRect().bottom).toBeLessThanOrEqual(display(c).getBoundingClientRect().bottom + 1);
    },
  },

  LeavingBrowse: {
    ...withState({ display: 'mix' }),
    act: async ({ canvasElement: c }) => {
      cell(c, 'add').dataset.before = screenKind(c);
      await press(c, 'add');
      expect(screenKind(c)).toBe('browse');
      expect(tab(c, 'top', 1).querySelector('[role="img"]')).toHaveAccessibleName('close');
      await press(c, 'upper-1');
    },
    check: ({ canvasElement: c }) => {
      expect(cell(c, 'add').dataset.before).toBe('mix-global');
      expect(screenKind(c)).toBe('mix-global');
    },
  },

  TypingACharacter: {
    // k is the thirty-seventh character: A to Z, then a to k.
    ...withState(typing('Sec', 36)),
    act: async ({ canvasElement: c }) => {
      expect(overlay(c, 'text-entry')!.querySelector('[data-highlighted]')).toHaveAttribute('data-character', 'k');
      await click(c, 'jog');
    },
    check: ({ canvasElement: c }) => {
      expect(overlay(c, 'text-entry')!.querySelector('[data-part="entry"]')).toHaveAccessibleName('Text: Seck');
      expect(overlay(c, 'text-entry')!.querySelector('[data-part="before"]')).toHaveTextContent('Seck');
    },
  },

  Done: {
    ...withState(typing('Second take', 0)),
    act: async ({ canvasElement: c }) => {
      expect(names(c, 'top')[7]).toBe('Done');
      await press(c, 'upper-8');
    },
    check: (context) => {
      expect(all(context, 'rename-set')).toEqual([{ kind: 'edit', action: 'rename-set', set: 'set-2', text: 'Second take' }]);
      expect(overlay(context.canvasElement, 'text-entry')).toBeNull();
    },
  },

  LeavingWithoutAccepting: {
    ...withState(typing('Second take', 0)),
    act: async ({ canvasElement: c }) => {
      expect(tab(c, 'top', 1).querySelector('[role="img"]')).toHaveAccessibleName('close');
      await press(c, 'upper-1');
    },
    check: (context) => {
      expect(overlay(context.canvasElement, 'text-entry')).toBeNull();
      expect(asked(context)).toEqual([]);
      expect(screenKind(context.canvasElement)).toBe('sets');
    },
  },

  Pairing: {
    act: async ({ canvasElement: c }) => {
      expect(overlay(c, 'dialog')).toBeNull();
      await given(c, (set) => void (set.unit.software.code = { purpose: 'pair', code: '733190' }));
    },
    check: async ({ canvasElement: c }) => {
      await waitFor(() => expect(overlay(c, 'dialog')).not.toBeNull());
      expect(overlay(c, 'dialog')!.querySelector('[data-part="code"]')).toHaveTextContent('733 190');
      expect(overlay(c, 'dialog')).toHaveAccessibleName('Pair this Push');
      expect(tab(c, 'top', 1).querySelector('[role="img"]')).toHaveAccessibleName('close');
      expect(lampState(c, 'upper-1')).not.toBe('off');
    },
  },

  CancellingADelete: {
    ...withState({ display: 'sets', sets: { highlight: 1, sort: 'date' }, confirm: { text: 'Delete Sketch 14?', yes: { kind: 'edit', action: 'delete-set', set: 'set-2', label: 'Delete' } } }),
    act: async ({ canvasElement: c }) => {
      expect(overlay(c, 'confirm')).toHaveAccessibleName('Delete Sketch 14?');
      await press(c, 'upper-1');
    },
    check: (context) => {
      const c = context.canvasElement;
      expect(asked(context)).toEqual([]);
      expect(overlay(c, 'confirm')).toBeNull();
      expect(screenKind(c)).toBe('sets');
      expect(lists(c)[0].rows).toContain('Sketch 14');
    },
  },

  AnOctaveChange: {
    set: onTrack('t-bass'),
    act: async ({ canvasElement: c }) => {
      await press(c, 'octave-up');
      cell(c, 'octave-up').dataset.notice = overlay(c, 'notice')?.textContent ?? '';
      cell(c, 'octave-up').dataset.under = screenKind(c) ?? '';
    },
    check: async ({ canvasElement: c }) => {
      expect(cell(c, 'octave-up').dataset.notice).toContain('C2 to C6');
      // Over the screen, not in place of it.
      expect(cell(c, 'octave-up').dataset.under).toBe('device');
      await wait(NOTICE_MS + 400);
      expect(overlay(c, 'notice')).toBeNull();
      expect(screenKind(c)).toBe('device');
    },
  },

  LowBattery: {
    act: async ({ canvasElement: c }) => {
      expect(overlay(c, 'battery')).toBeNull();
      await given(c, (set) => void (set.unit.battery = { percent: 5, charging: false }));
    },
    check: async ({ canvasElement: c }) => {
      await waitFor(() => expect(overlay(c, 'battery')).not.toBeNull());
      expect(overlay(c, 'battery')).toHaveAccessibleName('Battery 5 percent');
      expect(overlay(c, 'battery')).toHaveAttribute('data-low');
      expect(screenKind(c)).toBe('device');
      expect(paramText(c, 1)).toContain('Kick Tune');
    },
  },

  CountIn: {
    set: (set) => void (set.transport.countingIn = 0.25),
    act: async ({ canvasElement: c }) => {
      const bar = overlay(c, 'count-in')!;
      const d = display(c).getBoundingClientRect();
      cell(c, 'record').dataset.first = [bar.getAttribute('aria-valuenow'), Math.round((bar.getBoundingClientRect().width / d.width) * 100), Math.round(bar.getBoundingClientRect().top - d.top)].join('|');
      await given(c, (set) => void (set.transport.countingIn = 0.75));
      await waitFor(() => expect(overlay(c, 'count-in')).toHaveAttribute('aria-valuenow', '75'));
      cell(c, 'record').dataset.second = String(Math.round((overlay(c, 'count-in')!.getBoundingClientRect().width / d.width) * 100));
      await given(c, (set) => {
        delete set.transport.countingIn;
        set.transport.recording = 'session';
      });
    },
    check: async ({ canvasElement: c }) => {
      const [now, width, top] = cell(c, 'record').dataset.first!.split('|').map(Number);
      expect(now).toBe(25);
      expect(Math.abs(width - 25)).toBeLessThanOrEqual(2);
      expect(Math.abs(top)).toBeLessThanOrEqual(2);
      expect(Math.abs(Number(cell(c, 'record').dataset.second) - 75)).toBeLessThanOrEqual(2);
      await waitFor(() => expect(overlay(c, 'count-in')).toBeNull());
    },
  },

  AnArmedTrack: {
    set: (set) => {
      for (const track of set.tracks) track.armed = false;
      set.tracks[4].armed = true;
    },
    act: none,
    check: ({ canvasElement: c }) => {
      expect(tab(c, 'bottom', 5).querySelector('[data-part="armed"]')).toHaveAccessibleName('armed');
      // Column 1 is the selected track, which the pads play: it is not asked about here.
      for (const col of [2, 3, 4, 6, 7, 8]) expect(tab(c, 'bottom', col).querySelector('[data-part="armed"]')).toBeNull();
      const mark = tab(c, 'bottom', 5).querySelector('[data-part="armed"]')!.getBoundingClientRect();
      expect(mark.width).toBeGreaterThan(0);
      expect(mark.width).toBeCloseTo(mark.height, 0);
    },
  },

  APlayingClip: {
    set: (set) => {
      set.tracks[1].playing = 0;
      Object.assign(set.tracks[1].clips[0]!, { state: 'playing', position: 4 });
    },
    act: none,
    check: ({ canvasElement: c }) => {
      const bar = tab(c, 'bottom', 2).querySelector<HTMLElement>('[data-part="progress"]')!;
      expect(bar).toHaveAttribute('aria-valuenow', '50');
      expect(tab(c, 'bottom', 1).querySelector('[data-part="progress"]')).toBeNull();
      expect(Number(bar.style.getPropertyValue('--push-fraction'))).toBeCloseTo(0.5);
      // Under the name, most of the column wide.
      expect(bar.getBoundingClientRect().width).toBeGreaterThan(tab(c, 'bottom', 2).getBoundingClientRect().width * 0.7);
      expect(bar.getBoundingClientRect().top).toBeGreaterThan(tab(c, 'bottom', 2).querySelector('[data-part="label"]')!.getBoundingClientRect().top);
    },
  },

  ReturnTracks: {
    set: (set) => void (set.tracks = set.tracks.slice(0, 6)),
    act: none,
    check: ({ canvasElement: c }) => {
      expect(names(c, 'bottom')).toEqual(['Drums', 'Bass', 'Keys', 'Sampler', 'Vocals', 'Guitar', 'A Reverb', 'B Delay']);
      expect(tab(c, 'bottom', 7)).toHaveAttribute('data-icon', 'return');
      expect(tab(c, 'bottom', 8)).toHaveAttribute('data-icon', 'return');
      expect(tab(c, 'bottom', 6)).not.toHaveAttribute('data-icon', 'return');
    },
  },

  NoLevel: {
    ...withState({ display: 'mix' }),
    act: none,
    check: ({ canvasElement: c }) => {
      const meters = [...display(c).querySelectorAll<HTMLElement>('.push-display__meter')];
      expect(meters.length).toBeGreaterThan(0);
      for (const meter of meters) expect(meter).toHaveAttribute('data-unmeasured');
      // Empty: no bar reaches above its foot.
      for (const fill of display(c).querySelectorAll<HTMLElement>('.push-display__meter [role="meter"]')) expect(Number(fill.getAttribute('aria-valuenow') ?? 0)).toBeLessThanOrEqual(Number(fill.getAttribute('aria-valuemin') ?? 0));
    },
  },

  NoClip: {
    set: onTrack('t-empty'),
    act: async ({ canvasElement: c }) => {
      await press(c, 'clip');
    },
    check: ({ canvasElement: c }) => {
      expect(screenKind(c)).toBe('clip');
      expect(bodyTexts(c)[1]).toBe('No Clip');
      expect(columns(c)).toEqual([1]);
    },
  },

  UserMode: {
    set: (set) => void (set.unit.mode = 'control'),
    act: async ({ canvasElement: c }) => {
      await press(c, 'user');
    },
    check: ({ canvasElement: c }) => {
      expect(screenKind(c)).toBe('user');
      expect(screenText(c)).toBe('User Mode');
      expect(rowTexts(c, 'top').join('')).toBe('');
      expect(rowTexts(c, 'bottom').join('')).toBe('');
      expect(paramCells(c)).toHaveLength(0);
    },
  },
} satisfies Record<string, Play>;
