// The Setup menu and Learn (openspec: push-setup). Every value is read from the unit's readings
// in the Set and every change is an intent: the menu holds no setting of its own. Each tab is a
// list of fields under the encoders and buttons on the upper display buttons.
import { indexOf } from '../layout';
import { clamp } from '../state';
import { shapeForce } from '../velocity';
import { holding, isDown, lamp, push, screen, type Ctx, type Layer } from '../engine';
import type { BodyCell, DisplayMode, Overlay, PushSet, PushState, RowCell } from '../types';
import { listChoose, listMove } from './dialogs';
import { gather } from './params';

export const SETUP_TABS = ['Status', 'Expression', 'Sensitivity', 'Audio', 'MIDI', 'Pedals & CV', 'Preferences', 'Software'] as const;

/** One thing under an encoder: what is drawn, and what a turn asks. `moved` is whole choices, `steps` the raw turn. */
interface Field {
  cell: BodyCell;
  turn?(ctx: Ctx, moved: number, steps: number): void;
  /** A choice moves once every few steps; a level moves with every step. */
  level?: boolean;
}
/** One upper display button: what it reads, and what a press asks. */
interface Button {
  col: number;
  cell: RowCell;
  press?(ctx: Ctx): void;
}
interface Tab {
  fields: Field[];
  buttons: Button[];
  overlays?: Overlay[];
}

const setting = (ctx: Ctx, name: string, value: unknown, more: Record<string, unknown> = {}) => push(ctx, 'set-setting', { setting: name, value, ...more });
const onOff = (on: boolean) => (on ? 'On' : 'Off');

/** A field that chooses among words. */
function choice(col: number, name: string, value: string, choices: string[], ask: (ctx: Ctx, next: string) => void, more: Partial<BodyCell> = {}): Field {
  return {
    cell: { type: 'param', col, name, value, fraction: 0, style: 'choice', choices, chosen: Math.max(0, choices.indexOf(value)), ...more } as BodyCell,
    turn: (ctx, moved) => {
      if ((more as { disabled?: boolean }).disabled) return;
      const next = choices[clamp(Math.max(0, choices.indexOf(value)) + moved, 0, choices.length - 1)];
      if (next !== undefined && next !== value) ask(ctx, next);
    },
  };
}
/** A field that is a level between two ends. */
function level(col: number, name: string, value: number, low: number, high: number, unit: string, ask: (ctx: Ctx, next: number) => void, by = 1, more: Partial<BodyCell> = {}): Field {
  return {
    level: true,
    cell: { type: 'param', col, name, value: `${Math.round(value * 10) / 10}${unit}`, fraction: (value - low) / (high - low), style: 'arc', ...more } as BodyCell,
    turn: (ctx, _moved, steps) => {
      const next = clamp(Math.round((value + steps * by) * 10) / 10, low, high);
      if (next !== value) ask(ctx, next);
    },
  };
}
const text = (col: number, span: number, words: string, more: Partial<BodyCell> = {}): Field => ({ cell: { type: 'text', col, span, text: words, size: 'label', ...more } as BodyCell });
const button = (col: number, label: string, press?: (ctx: Ctx) => void, more: Partial<RowCell> = {}): Button => ({ col, cell: { label, ...more }, press });
const switchButton = (col: number, label: string, on: boolean, press: (ctx: Ctx) => void): Button => button(col, `${label}: ${onOff(on)}`, press, { selected: on });

/** A pad is 26.5 mm wide: the in-tune width is kept as a share of it, and shown in millimetres. */
const PAD_MM = 26.5;

function status(state: PushState, set: PushSet): Tab {
  const u = set.unit;
  const networks = u.wifi.on ? u.wifi.networks : [];
  const chosen = networks[clamp(state.setup.highlight, 0, Math.max(0, networks.length - 1))];
  const connected = networks.find((n) => n.connected);
  const forget = holding(state, 'shift');
  const fields: Field[] = [
    level(1, 'Display Light', u.displayLight, 0, 100, ' %', (ctx, v) => setting(ctx, 'display-light', v)),
    level(2, 'LED Brightness', u.ledBrightness, 0, 100, ' %', (ctx, v) => setting(ctx, 'led-brightness', v)),
    {
      cell: { type: 'list', col: 3, span: 2, label: 'Wi-Fi', items: networks.map((n) => ({ id: n.name, label: n.name, mark: n.connected ? 'Connected' : n.secured ? '' : 'Open', ...(n.connected ? { colour: 5 } : {}) })), chosen: chosen?.name },
      turn: (ctx, moved) => void (ctx.state.setup.highlight = clamp(ctx.state.setup.highlight + moved, 0, Math.max(0, networks.length - 1))),
    },
    text(5, 2, [u.name, u.mode === 'standalone' ? 'Standalone' : 'Control Mode', ...(u.processor && u.battery ? [`Battery ${u.battery.percent}%${u.battery.charging ? ', charging' : ''}`] : []), ...(u.processor && u.storage ? [`Storage ${u.storage.used} of ${u.storage.total}`] : []), ...(u.hotspot.on ? [`Hotspot ${u.hotspot.name ?? ''}`, `Password ${u.hotspot.password ?? ''}`] : [])].join(' · ')),
    choice(8, 'Link', onOff(!!set.transport.link?.on), ['Off', 'On'], (ctx, next) => setting(ctx, 'link', next === 'On')),
  ];
  const buttons: Button[] = [
    // A unit with no processor is always a controller: there is no mode to switch.
    ...(u.processor ? [button(1, u.mode === 'standalone' ? 'Control Live' : 'Standalone', (ctx) => push(ctx, 'set-unit-mode', { mode: u.mode === 'standalone' ? 'control' : 'standalone' }))] : []),
    switchButton(2, 'Wi-Fi', u.wifi.on, (ctx) => setting(ctx, 'wifi', !u.wifi.on)),
    ...(u.wifi.on && (forget ? connected : chosen)
      ? [
          forget
            ? button(3, 'Forget', (ctx) => push(ctx, 'forget-wifi', { network: connected!.name }))
            : button(3, 'Connect', (ctx) => {
                if (chosen!.secured && !chosen!.known) ctx.state.textEntry = { title: `Password for ${chosen!.name}`, text: '', highlighted: 0, then: { kind: 'setting', action: 'connect-wifi', network: chosen!.name } };
                else push(ctx, 'connect-wifi', { network: chosen!.name });
              }),
        ]
      : []),
    switchButton(4, 'Hotspot', u.hotspot.on, (ctx) => setting(ctx, 'hotspot', !u.hotspot.on)),
    switchButton(5, 'Play Sync', !!set.transport.link?.playSync, (ctx) => setting(ctx, 'play-sync', !set.transport.link?.playSync)),
  ];
  // The battery's mark, with its bolt while it charges.
  const overlays: Overlay[] = u.processor && u.battery ? [{ type: 'battery', percent: u.battery.percent, charging: u.battery.charging, low: false }] : [];
  return { fields, buttons, overlays };
}

function expression(_state: PushState, set: PushSet): Tab {
  const e = set.unit.expression;
  const modes = { mpe: 'MPE', 'poly-aftertouch': 'Poly Aftertouch', 'mono-aftertouch': 'Mono Aftertouch', off: 'Off' } as const;
  const names = ['MPE', 'Poly Aftertouch', 'Mono Aftertouch'];
  const fields: Field[] = [choice(1, 'Expression Mode', modes[e.mode], names, (ctx, next) => setting(ctx, 'expression-mode', (['mpe', 'poly-aftertouch', 'mono-aftertouch'] as const)[names.indexOf(next)]))];
  // Bend and slide are MPE's: the other modes send neither.
  if (e.mode === 'mpe') {
    const bends = { auto: 'Automatic', on: 'On', off: 'Off' } as const;
    fields.push(
      choice(2, 'Note Pitch Bend', bends[e.noteBend], ['Automatic', 'On', 'Off'], (ctx, next) => setting(ctx, 'note-pitch-bend', next === 'Automatic' ? 'auto' : next.toLowerCase())),
      choice(3, 'In Tune Location', e.inTune === 'finger' ? 'Finger' : 'Pad', ['Finger', 'Pad'], (ctx, next) => setting(ctx, 'in-tune-location', next.toLowerCase())),
      level(4, 'In Tune Width', Math.round(e.inTuneWidth * PAD_MM), 0, 20, ' mm', (ctx, v) => setting(ctx, 'in-tune-width', v, { unit: 'mm' })),
      level(5, 'Slide Height', e.slideHeight ?? 16, 10, 16, ' mm', (ctx, v) => setting(ctx, 'slide-height', v, { unit: 'mm' })),
    );
  }
  return { fields, buttons: [] };
}

/** The velocity curve as points, for the drawing: force across, velocity up. */
export function sensitivityCurve(s: PushSet['unit']['sensitivity']): [number, number][] {
  return Array.from({ length: 33 }, (_, i) => [i / 32, shapeForce(i / 32, s) ?? 0] as [number, number]);
}

function sensitivity(state: PushState, set: PushSet): Tab {
  const s = set.unit.sensitivity;
  const part = (col: number, name: string, key: 'threshold' | 'drive' | 'compand' | 'range'): Field => ({
    level: true,
    cell: { type: 'param', col, name, value: `${Math.round(s[key] * 100)} %`, fraction: s[key], style: key === 'drive' || key === 'compand' ? 'bipolar' : 'arc' },
    turn: (ctx, _moved, steps) => {
      const next = clamp(Math.round((s[key] + steps / 100) * 100) / 100, 0, 1);
      if (next !== s[key]) setting(ctx, `sensitivity-${key}`, next);
    },
  });
  // Where the last press fell: the force that gives its velocity on this curve.
  const press = state.setup.press;
  const curve = sensitivityCurve(s);
  const at = press === undefined ? undefined : (curve.find(([, y]) => y >= press - 1e-6)?.[0] ?? 1);
  return {
    fields: [
      part(1, 'Threshold', 'threshold'),
      part(2, 'Drive', 'drive'),
      part(3, 'Compand', 'compand'),
      part(4, 'Range', 'range'),
      { cell: { type: 'trace', col: 5, span: 4, drawing: { kind: 'curve', col: 5, span: 4, label: 'Velocity curve', points: curve, ...(at === undefined ? {} : { markers: [{ at, kind: 'playhead' }] }) } } },
    ],
    buttons: [button(8, 'Reset', (ctx) => push(ctx, 'reset-sensitivity'))],
  };
}

function audio(_state: PushState, set: PushSet): Tab {
  const a = set.unit.audio;
  const linked = !!a.inputs[1]?.linked;
  const inputs = a.inputs.flatMap((input, i): Field[] => {
    const which = linked && i === 0 ? a.inputs.map((_, n) => n + 1) : [i + 1];
    const names = input.types;
    const now = names.find((n) => n.toLowerCase() === input.type) ?? names[0];
    return [
      choice(3 + i * 2, `${input.name} Type`, now, names, (ctx, next) => setting(ctx, 'input-type', next.toLowerCase(), { inputs: which })),
      // The level meter beside the gain: the bar is the input's level, the reading its gain.
      { level: true, cell: { type: 'param', col: 4 + i * 2, name: `${input.name} Gain`, value: `${Math.round(input.gain * 20)} dB`, fraction: input.level, style: 'bar' }, turn: (ctx, _m, steps) => setting(ctx, 'input-gain', clamp(Math.round(input.gain * 20) + steps, 0, 20), { inputs: which, unit: 'dB' }) },
    ];
  });
  return {
    fields: [
      choice(1, 'Sample Rate', a.sampleRate, a.sampleRates, (ctx, next) => setting(ctx, 'sample-rate', next)),
      choice(2, 'Buffer Size', a.buffer, a.buffers, (ctx, next) => setting(ctx, 'buffer-size', next)),
      ...inputs,
      choice(7, a.outputs[0]?.name ?? 'Output', a.outputs[0]?.source ?? '', a.outputs[0]?.sources ?? [], (ctx, next) => setting(ctx, 'output-source', next, { output: a.outputs[0]?.name })),
      choice(8, 'Clock', a.clock, a.clocks, (ctx, next) => setting(ctx, 'clock-source', next)),
    ],
    buttons: [switchButton(3, 'Link 1 & 2', linked, (ctx) => setting(ctx, 'link-inputs', !linked))],
  };
}

function midi(state: PushState, set: PushSet): Tab {
  const ports = set.unit.midi.ports;
  const port = ports[clamp(state.setup.port ?? 0, 0, Math.max(0, ports.length - 1))];
  const side: 'input' | 'output' = state.setup.side === 'output' && port?.output ? 'output' : port?.input ? 'input' : 'output';
  const flags = port?.[side];
  const anySync = ports.some((p) => p.input?.sync);
  const flag = (col: number, label: string, key: 'track' | 'sync' | 'remote'): Button => switchButton(col, label, !!flags?.[key], (ctx) => setting(ctx, 'midi-port', !flags?.[key], { port: port.id, side, flag: key }));
  return {
    fields: [
      { cell: { type: 'list', col: 1, span: 2, label: 'Port', items: ports.map((p) => ({ id: p.id, label: p.name })), chosen: port?.id }, turn: (ctx, moved) => void (ctx.state.setup.port = clamp((ctx.state.setup.port ?? 0) + moved, 0, Math.max(0, ports.length - 1))) },
      {
        cell: { type: 'param', col: 3, name: 'Direction', value: side === 'input' ? 'Input' : 'Output', fraction: 0, style: 'choice', choices: ['Input', 'Output'], chosen: side === 'input' ? 0 : 1 },
        turn: (ctx, moved) => void (ctx.state.setup.side = moved > 0 ? 'output' : 'input'),
      },
      // Sync Delay shifts the clock an input follows: it is there when one does.
      ...(anySync ? [level(4, 'Sync Delay', set.unit.midi.syncDelay ?? 0, -100, 100, ' ms', (ctx, v) => setting(ctx, 'sync-delay', v, { unit: 'ms' }))] : []),
    ],
    buttons: port && flags
      ? [
          flag(3, 'Track', 'track'),
          flag(4, 'Sync', 'sync'),
          flag(5, 'Remote', 'remote'),
          ...(side === 'input' ? [switchButton(6, 'MPE', false, (ctx) => setting(ctx, 'midi-port', true, { port: port.id, side, flag: 'mpe' }))] : []),
          // External Sync follows an input's clock: with no input's Sync on there is nothing to follow.
          button(7, `External Sync: ${onOff(!!set.unit.midi.externalSync)}`, anySync ? (ctx) => setting(ctx, 'external-sync', !set.unit.midi.externalSync) : undefined, { selected: !!set.unit.midi.externalSync, ...(anySync ? {} : { dim: true }) }),
        ]
      : [],
  };
}

function pedals(_state: PushState, set: PushSet): Tab {
  const jack = (col: number, name: string, outputs: string): Field[] => {
    const j = set.unit.jacks[name] ?? {};
    const jobs = j.jobs ?? ['Footswitch', 'CV Out'];
    const now = j.job ?? jobs[0];
    return [choice(col, name, now, jobs, (ctx, next) => setting(ctx, 'jack', next, { jack: name })), text(col + 1, 1, now === 'CV Out' ? `CV outputs ${outputs}` : (j.plugged ?? 'Nothing plugged in'))];
  };
  return { fields: [...jack(1, 'Pedal 1', '5 and 6'), ...jack(3, 'Pedal 2', '7 and 8')], buttons: [] };
}

function preferences(_state: PushState, set: PushSet): Tab {
  const names = ['Workflow', 'Exclusive Arm', 'Exclusive Solo', 'Select on Launch'];
  return {
    fields: names.flatMap((name, i) => {
      const p = set.unit.preferences[name];
      return p ? [choice(i + 1, name, p.value, p.choices, (ctx, next) => setting(ctx, 'preference', next, { preference: name }))] : [];
    }),
    buttons: [],
  };
}

const INFO = { legal: { title: 'Legal Info', address: 'ableton.com/legal' }, crash: { title: 'Crash Info', address: 'push.local/crash' } } as const;

function software(state: PushState, set: PushSet): Tab {
  const s = set.unit.software;
  const update = s.update;
  const busy = update?.state === 'downloading' || update?.state === 'installing';
  const fields: Field[] = [text(1, 3, `Version ${s.version}`, { size: 'value' }), text(4, 3, s.authorized ? `${s.licence}${s.account ? ` · ${s.account}` : ''}` : 'Not authorized')];
  if (update) fields.push(text(7, 2, `Version ${update.version} ${update.state === 'ready' ? 'is ready to install' : update.state === 'available' ? 'is available' : `is ${update.state}`}`));
  // With Shift held the advanced options take the buttons.
  const buttons: Button[] = holding(state, 'shift')
    ? [
        button(1, 'Legal Info', (ctx) => void (ctx.state.setup.info = 'legal')),
        button(2, 'Crash Info', (ctx) => void (ctx.state.setup.info = 'crash')),
        button(3, 'Reset Push', (ctx) => void (ctx.state.confirm = { text: 'Reset Push to its factory state?', yes: { kind: 'setting', action: 'reset-unit', label: 'Reset' } })),
      ]
    : [
        button(1, 'Authorize', (ctx) => push(ctx, 'authorize', { purpose: 'authorize' })),
        ...(s.beta ? [] : [switchButton(2, 'Send Usage Data', s.usageData, (ctx) => setting(ctx, 'usage-data', !s.usageData))]),
        ...(update && !busy ? [button(3, 'Update', (ctx) => push(ctx, 'update-software', { version: update.version }))] : []),
        ...(busy ? [button(3, 'Cancel', (ctx) => push(ctx, 'cancel-update'))] : []),
      ];
  const overlays: Overlay[] = [];
  if (busy) overlays.push({ type: 'progress', label: `${update!.state === 'installing' ? 'Installing' : 'Downloading'} version ${update!.version}`, fraction: update!.progress ?? 0 });
  if (state.setup.info) overlays.push({ type: 'dialog', title: INFO[state.setup.info].title, address: INFO[state.setup.info].address });
  return { fields, buttons, overlays };
}

const TABS = [status, expression, sensitivity, audio, midi, pedals, preferences, software];
const tabOf = (state: PushState, set: PushSet): Tab => TABS[clamp(state.setup.tab, 0, TABS.length - 1)](state, set);

export const setup: Layer = {
  name: 'setup',
  active: (state) => state.display === 'setup',
  step(ctx) {
    const { state, set, input, target } = ctx;
    if (!target) return false;
    const tab = tabOf(state, set);
    // The legal and crash dialogs close on the X.
    if (state.setup.info) {
      if (isDown(ctx, 'upper-1') || isDown(ctx, 'upper-8')) delete state.setup.info;
      return target.cluster === 'upper' || target.cluster === 'lower' || target.kind === 'encoder';
    }
    const lower = indexOf(target.id, 'lower');
    if (lower !== undefined) {
      if (input.kind === 'down' && SETUP_TABS[lower - 1]) {
        state.setup.tab = lower - 1;
        state.setup.highlight = 0;
      }
      return true;
    }
    const upper = indexOf(target.id, 'upper');
    if (upper !== undefined) {
      if (input.kind === 'down') tab.buttons.find((b) => b.col === upper)?.press?.(ctx);
      return true;
    }
    const encoder = indexOf(target.id, 'encoder');
    if (encoder !== undefined) {
      if (input.kind !== 'turn') return true;
      const field = tab.fields.find((f) => encoder >= f.cell.col && encoder < f.cell.col + (f.cell.span ?? 1) && f.turn);
      if (!field) return true;
      const steps = input.value ?? 0;
      if (field.level) field.turn!(ctx, 0, steps);
      else {
        const moved = gather(state.notes, steps);
        if (moved) field.turn!(ctx, moved, steps);
      }
      return true;
    }
    // On the Sensitivity tab a pad press is marked on the curve, as well as played.
    if (state.setup.tab === 2 && target.kind === 'pad' && input.kind === 'down') state.setup.press = ((input.velocity ?? 100) - 1) / 126;
    return false;
  },
  paint(paint) {
    const { state, set } = paint;
    const tab = tabOf(state, set);
    const update = !!set.unit.software.update;
    const top: (RowCell | null)[] = Array.from({ length: 8 }, (_, i) => tab.buttons.find((b) => b.col === i + 1)?.cell ?? null);
    if (state.setup.info) top[0] = { label: '', icon: 'close' };
    paint.screen = screen('setup', {
      top,
      // A tab with news carries an asterisk.
      bottom: SETUP_TABS.map((label, i) => ({ label: i === 7 && update ? 'Software*' : label, selected: i === state.setup.tab })),
      body: tab.fields.map((f) => ({ ...f.cell, ...(state.touched.includes(`encoder-${f.cell.col}`) && f.cell.type === 'param' ? { touched: true } : {}) })),
      overlays: tab.overlays ?? [],
    });
  },
};

/* ---------- Learn ---------- */

export const learn: Layer = {
  name: 'learn',
  active: (state) => state.display === 'learn',
  step(ctx) {
    const { state, set, input, target } = ctx;
    if (!target) return false;
    const l = state.learn;
    const lesson = set.lessons.find((x) => x.id === l.lesson);
    const upper = indexOf(target.id, 'upper');
    if (lesson) {
      const pages = lesson.steps?.length ?? 1;
      const page = clamp(l.step ?? 0, 0, pages - 1);
      if (upper !== undefined) {
        if (input.kind !== 'down') return true;
        if (upper === 1) {
          delete l.lesson;
          delete l.step;
        } else if (upper === 7 && page > 0) l.step = page - 1;
        else if (upper === 8 && page < pages - 1) l.step = page + 1;
        return true;
      }
      return listMove(ctx) !== 0 || listChoose(ctx);
    }
    const move = listMove(ctx);
    if (move) return (l.highlight = clamp(l.highlight + move, 0, Math.max(0, set.lessons.length - 1))), true;
    if (listChoose(ctx)) {
      const chosen = set.lessons[clamp(l.highlight, 0, Math.max(0, set.lessons.length - 1))];
      if (chosen) {
        l.lesson = chosen.id;
        l.step = 0;
        push(ctx, 'open-lesson', { lesson: chosen.id });
      }
      return true;
    }
    if (upper === 1 && input.kind === 'down') return (state.display = (state.momentary?.display ?? 'device') as DisplayMode), true;
    return upper !== undefined;
  },
  paint(paint) {
    const { state, set, lamps } = paint;
    const l = state.learn;
    const lesson = set.lessons.find((x) => x.id === l.lesson);
    const X: RowCell = { label: '', icon: 'close' };
    if (lesson) {
      const pages = lesson.steps?.length ?? 1;
      const page = clamp(l.step ?? 0, 0, pages - 1);
      paint.screen = screen('lesson', {
        top: [X, { label: lesson.name, selected: true }, null, null, null, null, { label: 'Previous', ...(page > 0 ? {} : { dim: true }) }, { label: 'Next', ...(page < pages - 1 ? {} : { dim: true }) }],
        body: [
          { type: 'text', col: 1, span: lesson.link ? 6 : 8, text: lesson.steps?.[page] ?? '', size: 'value' },
          { type: 'text', col: 1, span: 2, text: `Page ${page + 1} of ${pages}`, size: 'label', tone: 'dim' },
          ...(lesson.link ? [{ type: 'text' as const, col: 7, span: 2, text: `More at ${lesson.link}`, size: 'label' as const }] : []),
        ],
        close: true,
      });
      return;
    }
    const highlight = clamp(l.highlight, 0, Math.max(0, set.lessons.length - 1));
    paint.screen = screen('learn', { top: [X, null, null, null, null, null, null, null], body: [{ type: 'list', col: 1, span: 4, label: 'Lessons', items: set.lessons.map((x) => ({ id: x.id, label: x.name, ...(x.done ? { mark: '✓' } : {}) })), chosen: set.lessons[highlight]?.id }], close: true });
    lamps['dpad-up'] = lamp(highlight > 0 ? 'dim' : 'off');
    lamps['dpad-down'] = lamp(highlight < set.lessons.length - 1 ? 'dim' : 'off');
    lamps['dpad-centre'] = lamp(set.lessons.length ? 'dim' : 'off');
  },
};
