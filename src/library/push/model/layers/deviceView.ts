// Device View: the track's devices along the top row, one device's parameters under the encoders,
// Racks, macros and a device's own drawing (openspec: push-device-view).
import { indexOf } from '../layout';
import { clamp, deviceById, everyDevice, selectedTrack } from '../state';
import { holdJob, isDown, isUp, push, screen, use, type Combo, type Ctx, type Layer } from '../engine';
import type { Bank, BodyCell, Device, Drawing, ListItem, Parameter, PushSet, PushState, RowCell, Track } from '../types';
import { gather, paramCell, turnParameter } from './params';

/** One thing in the top row: a device, with where it sits in a Rack's fold. */
export interface DeviceItem {
  device: Device;
  /** Inside an unfolded Rack: `child`, or `end` for the last one. The Rack itself is `open`. */
  fold?: 'open' | 'child' | 'end';
  /** The Rack that holds it. */
  rack?: Device;
  /** It is a drum pad's device: the pad it belongs to. */
  pad?: number;
}

const isRack = (d: Device) => d.kind === 'instrument-rack' || d.kind === 'drum-rack' || d.kind === 'audio-effect-rack' || d.kind === 'midi-effect-rack';
const hasMacros = (d: Device) => isRack(d) && (d.macros?.length ?? 0) > 0;

/** The chain of a Rack whose devices show when it is unfolded: a Drum Rack's selected pad, else the chain chosen on the device (the first by default). */
function chainOf(rack: Device, state: PushState): { devices: Device[]; pad?: number } {
  if (rack.kind === 'drum-rack') {
    const pad = rack.pads?.find((p) => p.note === rack.selectedPad && !p.empty);
    return { devices: pad?.devices ?? [], pad: pad?.note };
  }
  const chain = rack.chains?.find((c) => c.id === state.device.chains?.[rack.id]) ?? rack.chains?.[0];
  return { devices: chain?.devices ?? [] };
}

/** The top row's devices in order, with an unfolded Rack's devices after it. */
export function deviceItems(state: PushState, track: Track): DeviceItem[] {
  const out: DeviceItem[] = [];
  const walk = (devices: Device[], rack?: Device, pad?: number) => {
    devices.forEach((device, i) => {
      const open = isRack(device) && state.device.unfolded.includes(device.id);
      const inner = open ? chainOf(device, state) : undefined;
      const last = !!rack && i === devices.length - 1 && !(inner && inner.devices.length);
      out.push({ device, rack, pad, fold: open && inner?.devices.length ? 'open' : rack ? (last ? 'end' : 'child') : undefined });
      if (inner) walk(inner.devices, device, inner.pad);
    });
  };
  walk(track.devices);
  return out;
}

/** The device whose parameters are shown: the Set's selected device when the top row has it, else the first. */
export function shownDevice(state: PushState, set: PushSet): DeviceItem | undefined {
  const items = deviceItems(state, selectedTrack(set));
  return items.find((i) => i.device.id === set.selection.device) ?? items[0];
}

/** A device's banks: a Rack's macros eight to a bank, its own named banks, or its bare parameters in eights. */
export function banksOf(device: Device): Bank[] {
  const eights = (list: (Parameter | null)[], name: (n: number) => string): Bank[] =>
    Array.from({ length: Math.ceil(list.length / 8) }, (_, n) => ({ name: name(n), parameters: list.slice(n * 8, n * 8 + 8) }));
  if (hasMacros(device)) return eights((device.macros ?? []).slice(0, device.macroCount ?? 8), (n) => `Macros ${n * 8 + 1} to ${n * 8 + 8}`);
  if (device.banks.length) return device.banks;
  return eights(device.parameters ?? [], (n) => `Bank ${n + 1}`);
}

const bankAt = (state: PushState, device: Device) => clamp(state.device.banks[device.id] ?? 0, 0, Math.max(0, banksOf(device).length - 1));
const shownBank = (state: PushState, device: Device): Bank | undefined => banksOf(device)[bankAt(state, device)];

const ICON: Partial<Record<Device['kind'], RowCell['icon']>> = { 'instrument-rack': 'rack', 'audio-effect-rack': 'rack', 'midi-effect-rack': 'rack', 'drum-rack': 'drum-rack' };

/** A drawing as display cells: a line behind the columns it spans, a bar for gain reduction, a centred arc and a note for the tuner. */
function drawingCells(d: Drawing, colour: number, off = false): BodyCell[] {
  if (off) return drawingCells(d, colour).map((c) => (c.type === 'trace' ? { ...c, dim: true } : { ...c, disabled: true }));
  if (d.kind === 'gain-reduction') return [{ type: 'param', col: d.col, span: d.span, name: 'Gain Reduction', value: d.label ?? '', fraction: d.value ?? 0, style: 'bar', colour }];
  if (d.kind === 'tuner') return [{ type: 'param', col: d.col, span: d.span, name: 'Tuner', value: d.label ?? '', fraction: clamp(((d.value ?? 0) + 1) / 2, 0, 1), style: 'bipolar', colour }];
  const points = d.kind === 'waveform' && d.peaks ? d.peaks.map(([, high], i) => [i / Math.max(1, d.peaks!.length - 1), high] as [number, number]) : d.points;
  return [{ type: 'trace', col: d.col, span: d.span, under: true, colour, drawing: { ...d, points } }];
}

const MENU = ['Randomize Macros', 'Add Variation'];
const VARIATION_MENU = ['Overwrite', 'Rename', 'Delete'];

/** The Rack whose macro bank is on the display, if that is what is shown. */
function macroRack(state: PushState, set: PushSet): Device | undefined {
  const shown = shownDevice(state, set)?.device;
  return shown && hasMacros(shown) && !state.device.padSettings ? shown : undefined;
}

/** The parameters under the eight encoders now, whatever mode Device View is in. */
export function columns(state: PushState, set: PushSet): (Parameter | null)[] {
  const item = shownDevice(state, set);
  if (!item) return [];
  if (state.device.macroMap) {
    const rack = rackFor(state, set, state.device.macroMap.parameter);
    return (rack?.macros ?? []).slice(state.device.macroMap.page * 8, state.device.macroMap.page * 8 + 8);
  }
  return shownBank(state, item.device)?.parameters ?? [];
}

/** The Rack a parameter's device sits in, by the parameter's id. */
function rackFor(state: PushState, set: PushSet, parameter: string): Device | undefined {
  const track = selectedTrack(set);
  const holds = (d: Device) => banksOf(d).some((b) => b.parameters.some((p) => p?.id === parameter));
  const inside = (rack: Device): boolean => [...(rack.chains ?? []).flatMap((c) => c.devices), ...(rack.pads ?? []).flatMap((p) => p.devices ?? [])].some((d) => holds(d) || (isRack(d) && inside(d)));
  return everyDevice(track.devices).filter((d) => hasMacros(d) && inside(d)).at(-1);
}

/** The parameter whose encoder is touched, with its column, if one is. */
function touchedParameter(state: PushState, set: PushSet): { p: Parameter; col: number } | undefined {
  for (const id of state.touched) {
    const col = indexOf(id, 'encoder');
    const p = col === undefined ? undefined : columns(state, set)[col - 1];
    if (p && col !== undefined) return { p, col };
  }
  return undefined;
}

/** What the last two upper display buttons offer now, over the devices that would be there. */
function offers(state: PushState, set: PushSet): Partial<Record<number, { label: string; run(ctx: Ctx): void }>> {
  const d = state.device;
  if (d.macroMap) return { 8: { label: 'Done', run: (ctx) => void delete ctx.state.device.macroMap } };
  if (d.macroEdit !== undefined) {
    const rack = macroRack(state, set);
    const about = { device: rack?.id, macro: d.macroEdit };
    return {
      5: { label: 'Rename', run: (ctx) => void (ctx.state.textEntry = { title: 'Rename Macro', text: rack?.macros?.[d.macroEdit! - 1]?.name ?? '', highlighted: 0, then: { kind: 'edit', action: 'set-macro', ...about } }) },
      6: { label: 'Delete Map', run: (ctx) => (push(ctx, 'unmap-macro', about), void delete ctx.state.device.macroEdit) },
      8: { label: 'Done', run: (ctx) => void delete ctx.state.device.macroEdit },
    };
  }
  if (d.marked?.length) {
    const track = selectedTrack(set);
    const one = d.marked.length === 1 ? deviceById(track, d.marked[0]) : undefined;
    return one && isRack(one)
      ? { 8: { label: 'Ungroup', run: (ctx) => (push(ctx, 'ungroup-devices', { track: track.id, device: one.id }), void delete ctx.state.device.marked) } }
      : { 8: { label: 'Group', run: (ctx) => (push(ctx, 'group-devices', { track: track.id, devices: [...d.marked!] }), void delete ctx.state.device.marked) } };
  }
  const touched = touchedParameter(state, set);
  if (!touched) return {};
  const rack = macroRack(state, set);
  if (rack) {
    if (!touched.p.mappings && touched.p.mappings !== undefined) return {};
    const macro = bankAt(state, rack) * 8 + touched.col;
    return {
      7: { label: 'Edit', run: (ctx) => void (ctx.state.device.macroEdit = macro) },
      8: { label: 'Unmap', run: (ctx) => push(ctx, 'unmap-macro', { device: rack.id, macro }) },
    };
  }
  if (rackFor(state, set, touched.p.id)) return { 8: { label: 'Map', run: (ctx) => void (ctx.state.device.macroMap = { parameter: touched.p.id, page: 0 }) } };
  return {};
}

function variationItems(rack: Device): ListItem[] {
  return [...MENU.map((label, i) => ({ id: `menu-${i}`, label })), ...(rack.variations ?? []).map((label, i) => ({ id: `variation-${i}`, label, mark: i === rack.variation ? '●' : '›' }))];
}

/* ---------- step ---------- */

function variationsStep(ctx: Ctx, rack: Device): boolean {
  const { input, state } = ctx;
  const v = state.device.variations!;
  const items = variationItems(rack);
  const id = input.control;
  const move = (by: number) => {
    if (v.menu !== undefined) v.menu = clamp(v.menu + by, 0, VARIATION_MENU.length - 1);
    else v.highlight = clamp(v.highlight + by, 0, items.length - 1);
  };
  if (id === 'jog' && input.kind === 'turn') return move(Math.sign(input.value ?? 0)), true;
  if (isDown(ctx, 'dpad-up')) return move(-1), true;
  if (isDown(ctx, 'dpad-down')) return move(1), true;
  const variation = v.highlight - MENU.length;
  if ((id === 'jog' && input.kind === 'nudge' && (input.value ?? 0) > 0) || isDown(ctx, 'dpad-right')) {
    if (variation >= 0 && v.menu === undefined) v.menu = 0;
    return true;
  }
  if ((id === 'jog' && input.kind === 'nudge') || isDown(ctx, 'dpad-left')) {
    if (v.menu !== undefined) delete v.menu;
    else delete state.device.variations;
    return true;
  }
  if (isDown(ctx, 'jog') || isDown(ctx, 'dpad-centre')) {
    const about = { device: rack.id };
    if (v.menu !== undefined) {
      const what = VARIATION_MENU[v.menu];
      if (what === 'Rename') state.textEntry = { title: 'Rename Variation', text: rack.variations?.[variation] ?? '', highlighted: 0, then: { kind: 'edit', action: 'macro-variation', ...about, variation, rename: true } };
      else push(ctx, 'macro-variation', { ...about, variation, [what === 'Overwrite' ? 'overwrite' : 'delete']: true });
      delete v.menu;
    } else if (v.highlight === 0) push(ctx, 'randomize-macros', about);
    else if (v.highlight === 1) push(ctx, 'macro-variation', { ...about, store: true });
    else push(ctx, 'macro-variation', { ...about, variation, recall: true });
    return true;
  }
  return false;
}

function encoderStep(ctx: Ctx, col: number): boolean {
  const { input, state, set } = ctx;
  const d = state.device;
  const item = shownDevice(state, set);
  if (!item) return true;
  const track = selectedTrack(set);

  // A device's button held while an encoder turns moves the device along the chain.
  if (input.kind === 'turn') {
    for (const id of Object.keys(state.held)) {
      const at = indexOf(id, 'upper');
      const moving = at === undefined ? undefined : topItems(state, set)[at - 1];
      if (!moving) continue;
      use(ctx, id);
      push(ctx, 'move-device', { track: track.id, device: moving.device.id, by: input.value ?? 0 });
      return true;
    }
  }

  if (d.padSettings && item.pad !== undefined) {
    const rack = item.rack!;
    const pad = rack.pads?.find((p) => p.note === item.pad);
    if (input.kind === 'turn' && pad && (col === 1 || col === 2)) push(ctx, 'set-drum-pad', { track: track.id, device: rack.id, note: pad.note, ...(col === 1 ? { choke: clamp((pad.choke ?? 0) + Math.sign(input.value ?? 0), 0, 16) } : { transpose: clamp((pad.transpose ?? 0) + (input.value ?? 0), -48, 48) }) });
    return true;
  }

  if (d.macroMap) {
    const rack = rackFor(state, set, d.macroMap.parameter);
    if (input.kind === 'touch' && rack) push(ctx, 'map-macro', { track: track.id, device: rack.id, parameter: d.macroMap.parameter, macro: d.macroMap.page * 8 + col });
    return true;
  }

  if (d.macroEdit !== undefined) {
    const rack = macroRack(state, set);
    const macro = rack?.macros?.[d.macroEdit - 1];
    if (input.kind !== 'turn' || !rack) return true;
    const steps = input.value ?? 0;
    if (col === 1) {
      const moved = gather(state.notes, steps);
      if (moved) d.macroEdit = clamp(d.macroEdit + moved, 1, rack.macroCount ?? rack.macros?.length ?? 8);
    } else if (col === 2 && macro) turnParameter(ctx, macro, steps, { track: track.id, device: rack.id });
    else if ((col === 3 || col === 4) && macro) push(ctx, 'set-macro', { track: track.id, device: rack.id, macro: d.macroEdit, [col === 3 ? 'min' : 'max']: clamp((col === 3 ? (macro.min ?? 0) : (macro.max ?? 1)) + steps / 127, 0, 1) });
    return true;
  }

  const p = columns(state, set)[col - 1];
  if (!p) return true; // an empty column: nothing to change
  const about = { track: track.id, device: item.device.id };
  if (input.kind === 'turn') turnParameter(ctx, p, input.value ?? 0, about);
  else if (input.kind === 'touch') push(ctx, 'touch-parameter', { parameter: p.id, ...about });
  else if (input.kind === 'release') push(ctx, 'release-parameter', { parameter: p.id, ...about });
  return true;
}

/** The top row's items in view. */
function topItems(state: PushState, set: PushSet): (DeviceItem | undefined)[] {
  const items = deviceItems(state, selectedTrack(set));
  const start = clamp(state.device.page, 0, Math.max(0, items.length - 8));
  return Array.from({ length: 8 }, (_, i) => items[start + i]);
}

/** A device's button, pressed and let go: select it; already selected, open its banks, or fold a Rack, or step a Rack's macro bank. */
function devicePress(ctx: Ctx, item: DeviceItem): void {
  const { state, set } = ctx;
  const d = state.device;
  const { device } = item;
  const selected = shownDevice(state, set)?.device.id === device.id;
  if (!selected) {
    push(ctx, 'select-device', { track: selectedTrack(set).id, device: device.id });
    delete d.bankList;
    delete d.padSettings;
    delete d.variations;
    delete d.edit;
    return;
  }
  if (item.pad !== undefined) {
    // A drum pad's device: its parameters, then the pad's own choke group and transpose.
    d.padSettings = !d.padSettings;
    return;
  }
  if (isRack(device)) {
    const banks = banksOf(device).length;
    const at = bankAt(state, device);
    if (hasMacros(device) && at < banks - 1) d.banks[device.id] = at + 1;
    else {
      d.banks[device.id] = 0;
      d.unfolded = d.unfolded.includes(device.id) ? d.unfolded.filter((id) => id !== device.id) : [...d.unfolded, device.id];
    }
    return;
  }
  // A Simpler's button opens its Edit Mode: its banks below, its sample actions above. Any other device's opens its banks.
  if (device.kind === 'simpler' && device.sampler?.sample) d.edit = !d.edit;
  else d.bankList = !d.bankList;
}

/** Simpler's sample actions, for its mode: what Edit Mode puts on the upper display buttons after the device's own. */
export function sampleActions(device: Device): { id: string; label: string }[] {
  const sampler = device.sampler;
  if (!sampler) return [];
  return [
    ...(sampler.mode === 'classic' ? [{ id: 'loop', label: sampler.loop?.on ? 'Loop: On' : 'Loop: Off' }] : []),
    { id: 'warp-as', label: `Warp as ${sampler.warpBars ?? 1} Bar${(sampler.warpBars ?? 1) === 1 ? '' : 's'}` },
    { id: 'halve', label: ':2' },
    { id: 'double', label: 'x2' },
    // A sliced sample is not cropped: its slices would go with what is cut. It can be split at the selected slice instead.
    sampler.mode === 'slicing' ? { id: 'split-slice', label: 'Split Slice' } : { id: 'crop', label: 'Crop' },
    { id: 'reverse', label: sampler.reversed ? 'Reverse: On' : 'Reverse' },
  ];
}

/** The part of a sample in view, 0 to 1: all of it, narrowed by Zoom around the selected slice (Slicing) or the start. */
export function sampleWindow(device: Device): { from: number; to: number } {
  const sampler = device.sampler!;
  const width = 1 / (1 + sampler.zoom * 15);
  const centre = sampler.mode === 'slicing' ? (sampler.slices?.[sampler.selectedSlice ?? 0] ?? sampler.start) : sampler.start;
  const from = clamp(centre - width / 2, 0, 1 - width);
  return { from, to: from + width };
}

const inView = (ctx: Ctx) => ctx.state.display === 'device';
const deviceAt = (ctx: Ctx): DeviceItem | undefined => {
  const col = ctx.target ? indexOf(ctx.target.id, 'upper') : undefined;
  return col === undefined ? undefined : topItems(ctx.state, ctx.set)[col - 1];
};
const onDevice = (ctx: Ctx) => inView(ctx) && !!deviceAt(ctx);
const example = { press: 'upper-1' };

const combos: Combo[] = [
  {
    id: 'delete+upper',
    hold: ['delete'],
    press: 'upper',
    mode: 'Device View',
    asks: 'Delete the device above the button',
    when: onDevice,
    run: (ctx) => push(ctx, 'delete-device', { track: selectedTrack(ctx.set).id, device: deviceAt(ctx)!.device.id }),
    example,
  },
  {
    id: 'mute+upper',
    hold: ['mute'],
    press: 'upper',
    mode: 'Device View',
    asks: 'Switch the device above the button off or on',
    when: onDevice,
    run: (ctx) => push(ctx, 'toggle-device', { track: selectedTrack(ctx.set).id, device: deviceAt(ctx)!.device.id, on: !deviceAt(ctx)!.device.on }),
    example,
  },
  {
    id: 'save+upper',
    hold: ['save'],
    press: 'upper',
    mode: 'Device View',
    asks: 'Save the device or Rack above the button as a preset in the User Library',
    when: onDevice,
    run: (ctx) => push(ctx, 'save-preset', { track: selectedTrack(ctx.set).id, device: deviceAt(ctx)!.device.id }),
    example,
  },
  {
    id: 'shift+upper',
    hold: ['shift'],
    press: 'upper',
    mode: 'Device View',
    asks: 'Mark the device above the button: marked devices can be grouped into a Rack, a marked Rack ungrouped',
    when: onDevice,
    run: (ctx) => {
      const id = deviceAt(ctx)!.device.id;
      const marked = ctx.state.device.marked ?? [];
      ctx.state.device.marked = marked.includes(id) ? marked.filter((m) => m !== id) : [...marked, id];
    },
    example,
  },
  {
    id: 'delete+encoder',
    hold: ['delete'],
    press: 'encoder',
    kind: 'touch',
    mode: 'Device View',
    asks: 'Delete the parameter’s automation when it has any, else reset the parameter to its default',
    when: (ctx) => inView(ctx) && !!columns(ctx.state, ctx.set)[(indexOf(ctx.target!.id, 'encoder') ?? 0) - 1],
    run: (ctx) => {
      const p = columns(ctx.state, ctx.set)[indexOf(ctx.target!.id, 'encoder')! - 1]!;
      push(ctx, p.automated ? 'delete-automation' : 'reset-parameter', { parameter: p.id, track: selectedTrack(ctx.set).id });
    },
    example: { press: 'encoder-1' },
  },
];

export const deviceView: Layer = {
  name: 'device-view',
  active: (state) => state.display === 'device',
  combos,
  step(ctx) {
    const { input, state, set, target } = ctx;
    if (!target) return false;
    const d = state.device;
    const track = selectedTrack(set);
    const rack = macroRack(state, set);

    if (d.variations && rack && variationsStep(ctx, rack)) return true;
    // The jog wheel in a Rack's macro bank reaches its list of Randomize, Add Variation and the variations.
    if (target.id === 'jog' && input.kind === 'turn' && rack && !d.macroMap && d.macroEdit === undefined) {
      d.variations = { highlight: 0 };
      return true;
    }

    const encoder = indexOf(target.id, 'encoder');
    if (encoder !== undefined) return encoderStep(ctx, encoder);

    const upper = indexOf(target.id, 'upper');
    if (upper !== undefined) {
      const offer = offers(state, set)[upper];
      if (offer) {
        if (input.kind === 'down') offer.run(ctx);
        return true;
      }
      if (d.macroMap || d.macroEdit !== undefined) return true;
      // Simpler's Edit Mode: its own button leaves, the ones after it are its sample actions.
      const editing = d.edit ? shownDevice(state, set) : undefined;
      if (editing?.device.kind === 'simpler') {
        if (input.kind !== 'down') return true;
        const action = sampleActions(editing.device)[upper - 2];
        // Leaving is this press's whole job: when the button comes up it does not open Edit Mode again.
        if (upper === 1) {
          delete d.edit;
          use(ctx, target.id);
        } else if (action) push(ctx, 'sample-action', { track: track.id, device: editing.device.id, what: action.id });
        return true;
      }
      const item = topItems(state, set)[upper - 1];
      if (!item) return true; // nothing above this button
      // Acting on release leaves room for a hold: a Rack's chains, or a turn that moves the device.
      if (isUp(ctx) && state.held[target.id] && !state.held[target.id].used && !state.held[target.id].holding) devicePress(ctx, item);
      return true;
    }

    const lower = indexOf(target.id, 'lower');
    if (lower !== undefined) {
      // A Rack's button held: the lower buttons choose among its chains.
      const holding = Object.keys(state.held).find((id) => indexOf(id, 'upper') !== undefined && holdJob(state, id));
      const held = holding ? topItems(state, set)[indexOf(holding, 'upper')! - 1] : undefined;
      if (held && (held.device.chains?.length ?? 0) > 1) {
        const chain = held.device.chains![lower - 1];
        if (input.kind === 'down' && chain) {
          use(ctx, holding!);
          push(ctx, 'select-chain', { track: track.id, device: held.device.id, chain: chain.id });
          d.chains = { ...d.chains, [held.device.id]: chain.id };
          if (!d.unfolded.includes(held.device.id)) d.unfolded.push(held.device.id);
        }
        return true;
      }
      if (d.bankList || d.edit) {
        const item = shownDevice(state, set);
        if (input.kind === 'down' && item && banksOf(item.device)[lower - 1]) d.banks[item.device.id] = lower - 1;
        return true;
      }
    }
    return false;
  },
  paint(paint) {
    const { state, set } = paint;
    const d = state.device;
    const track = selectedTrack(set);
    const colour = track.colour;
    const shown = shownDevice(state, set);
    const items = topItems(state, set);
    paint.screen = screen('device', { bottom: paint.screen.bottom });

    if (!shown) {
      paint.screen.body = [{ type: 'text', col: 1, span: 8, text: 'No devices. Press Add to load one.', size: 'value', align: 'centre', tone: 'dim' }];
      return;
    }

    // The top row: the devices, the shown one a solid block; a Rack's macro bank as circles before its name.
    paint.screen.top = items.map((item): RowCell | null => {
      if (!item) return null;
      const { device } = item;
      const circles = hasMacros(device) && shown.device.id === device.id ? `${'●'.repeat(bankAt(state, device) + 1)} ` : '';
      return {
        label: `${circles}${device.name}`,
        colour,
        ...(ICON[device.kind] ? { icon: ICON[device.kind] } : item.pad !== undefined ? { icon: 'drum-rack' as const } : {}),
        ...(shown.device.id === device.id ? { selected: true } : {}),
        ...(device.on ? {} : { dim: true }),
        ...(item.fold ? { fold: item.fold === 'end' ? ('end' as const) : item.fold } : {}),
        ...(d.marked?.includes(device.id) ? { lamp: { state: 'blink' as const, colour } } : {}),
      };
    });
    for (const [col, offer] of Object.entries(offers(state, set))) if (offer) paint.screen.top[Number(col) - 1] = { label: offer.label, selected: true };

    // The bottom row: the tracks, or the shown device's banks, or a held Rack's chains.
    const holding = Object.keys(state.held).find((id) => indexOf(id, 'upper') !== undefined && holdJob(state, id));
    const held = holding ? items[indexOf(holding, 'upper')! - 1] : undefined;
    if (held && (held.device.chains?.length ?? 0) > 1) {
      const chosen = d.chains?.[held.device.id] ?? held.device.chains![0].id;
      paint.screen.bottom = Array.from({ length: 8 }, (_, i) => {
        const chain = held.device.chains![i];
        return chain ? { label: chain.name, colour: chain.colour ?? colour, selected: chain.id === chosen } : null;
      });
    } else if (d.bankList || d.edit) {
      const banks = banksOf(shown.device);
      paint.screen.bottom = Array.from({ length: 8 }, (_, i) => (banks[i] ? { label: banks[i].name, colour, selected: i === bankAt(state, shown.device) } : null));
    }

    // The body.
    const off = !shown.device.on;
    const touched = (col: number) => state.touched.includes(`encoder-${col}`);
    const cell = (p: Parameter | null, i: number, more: object = {}): BodyCell[] => (p ? [paramCell(p, i + 1, { colour, ...(touched(i + 1) ? { touched: true } : {}), ...(off || p.disabled ? { disabled: true } : {}), ...more })] : []);
    const rack = macroRack(state, set);

    if (d.variations && rack) {
      const list = variationItems(rack);
      const variation = d.variations.highlight - MENU.length;
      paint.screen.body = [
        { type: 'list', col: 1, span: 4, label: 'Macros', items: list, chosen: list[d.variations.highlight]?.id, ...(d.variations.menu === undefined ? {} : { enclosing: true }) },
        ...(d.variations.menu === undefined ? [] : [{ type: 'list' as const, col: 5, span: 4, label: rack.variations?.[variation] ?? '', items: VARIATION_MENU.map((label) => ({ id: label, label })), chosen: VARIATION_MENU[d.variations.menu] }]),
      ];
      return;
    }
    if (d.padSettings && shown.pad !== undefined) {
      const pad = shown.rack?.pads?.find((p) => p.note === shown.pad);
      const chokes = ['None', ...Array.from({ length: 16 }, (_, i) => String(i + 1))];
      paint.screen.body = [
        { type: 'param', col: 1, name: 'Choke', value: chokes[pad?.choke ?? 0], fraction: (pad?.choke ?? 0) / 16, style: 'choice', choices: chokes, chosen: pad?.choke ?? 0, colour, ...(touched(1) ? { touched: true } : {}) },
        { type: 'param', col: 2, name: 'Transpose', value: `${pad?.transpose ?? 0} st`, fraction: ((pad?.transpose ?? 0) + 48) / 96, style: 'bipolar', colour, ...(touched(2) ? { touched: true } : {}) },
      ];
      return;
    }
    if (d.macroEdit !== undefined && rack) {
      const macro = rack.macros?.[d.macroEdit - 1];
      const names = (rack.macros ?? []).slice(0, rack.macroCount ?? 8).map((m, i) => m?.name ?? `Macro ${i + 1}`);
      paint.screen.body = [
        { type: 'param', col: 1, name: 'Macro', value: names[d.macroEdit - 1], fraction: 0, style: 'choice', choices: names, chosen: d.macroEdit - 1, colour },
        ...(macro ? cell({ ...macro, name: 'Value' }, 1) : []),
        ...(macro ? [{ type: 'param' as const, col: 3, name: 'Min', value: `${Math.round((macro.min ?? 0) * 100)} %`, fraction: macro.min ?? 0, style: 'arc' as const, colour }, { type: 'param' as const, col: 4, name: 'Max', value: `${Math.round((macro.max ?? 1) * 100)} %`, fraction: macro.max ?? 1, style: 'arc' as const, colour }] : []),
      ];
      return;
    }

    // A Simpler: its sample across the display, the bank's parameters over it; in Edit Mode its actions along the top.
    const sampler = shown.device.kind === 'simpler' && !d.macroMap ? shown.device.sampler : undefined;
    if (sampler && !sampler.sample) {
      paint.screen.body = [{ type: 'text', col: 1, span: 8, text: 'No sample. Press Swap to load one.', size: 'value', align: 'centre', tone: 'dim' }];
      return;
    }
    if (sampler) {
      if (d.edit) paint.screen.top = [{ label: shown.device.name, colour, selected: true }, ...sampleActions(shown.device).map((a): RowCell => ({ label: a.label, colour })), null, null].slice(0, 8);
      const window = sampleWindow(shown.device);
      paint.screen.body = [
        {
          type: 'wave', col: 1, span: 8, under: true, colour, ...(off ? { dim: true } : {}), label: `${sampler.sample} waveform`, peaks: sampler.peaks, from: window.from, to: window.to,
          region: sampler.mode === 'classic' && sampler.loop?.on ? [sampler.loop.start, sampler.loop.end] : [sampler.start, sampler.end],
          markers: [
            { at: sampler.start, kind: 'start' },
            { at: sampler.end, kind: 'end' },
            ...(sampler.mode === 'slicing' ? (sampler.slices ?? []).map((at, i) => ({ at, kind: i === sampler.selectedSlice ? ('selected' as const) : ('slice' as const) })) : []),
            ...(sampler.playing === undefined ? [] : [{ at: sampler.playing, kind: 'playhead' as const }]),
          ],
        },
        ...columns(state, set).flatMap((p, i) => cell(p, i, { style: 'value' })),
      ];
      return;
    }

    const params = columns(state, set);
    const drawing = d.macroMap ? undefined : shownBank(state, shown.device)?.drawing;
    const under = (col: number) => !!drawing && drawing.kind !== 'gain-reduction' && drawing.kind !== 'tuner' && col >= drawing.col && col < drawing.col + drawing.span;
    paint.screen.body = [
      ...(drawing ? drawingCells(drawing, colour, off) : []),
      ...params.flatMap((p, i) => cell(p, i, under(i + 1) ? { style: 'value' } : {})),
    ];
  },
};

