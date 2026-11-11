// A stand-in host: the smallest app that answers the device. `applyIntent` takes a Set and one
// intent and returns the Set that results, or the same Set for an intent it does not know. The
// stories, the tests and the emulator's first run use it; a real app replaces it with its own
// engine. It is also the reference for what each intent means.
import { simplerBanks } from './sample';
import { everyDevice } from './state';
import type { BrowserItem, Parameter, PushIntent, PushSet, Track } from './types';

const copy = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const tracksOf = (set: PushSet): Track[] => [...set.tracks, ...set.returns, set.main];
const track = (set: PushSet, id: unknown): Track | undefined => tracksOf(set).find((t) => t.id === id);

/** Every parameter in the Set, wherever it is. */
export function everyParameter(set: PushSet): Parameter[] {
  const out: Parameter[] = [];
  for (const t of tracksOf(set)) {
    out.push(t.volume, t.pan, ...t.sends, ...(t.extras ?? []));
    for (const d of everyDevice(t.devices)) {
      for (const pad of d.pads ?? []) for (const p of [pad.volume, pad.pan]) if (p) out.push(p);
      for (const chain of d.chains ?? []) for (const p of [chain.volume, chain.pan]) if (p) out.push(p);
    }
    for (const d of everyDevice(t.devices)) {
      for (const b of d.banks) for (const p of b.parameters) if (p) out.push(p);
      for (const m of d.macros ?? []) if (m) out.push(m);
    }
  }
  return out;
}

/** How a stand-in words a value it has changed: the choice, On or Off, or a percentage. */
function word(p: Parameter): string {
  if (p.kind === 'choice' && p.choices?.length) return p.choices[Math.round(p.value * (p.choices.length - 1))];
  if (p.kind === 'switch') return p.value >= 0.5 ? 'On' : 'Off';
  if (p.kind === 'bipolar') return p.value === 0.5 ? 'C' : `${Math.round((p.value - 0.5) * 200)}`;
  return `${Math.round(p.value * 100)} %`;
}

type Apply = (set: PushSet, intent: PushIntent) => void;

function packState(s: PushSet, id: unknown, state: PushSet['packs'][number]['state'], progress?: number): void {
  const pack = s.packs.find((p) => p.id === id);
  if (!pack) return;
  pack.state = state;
  if (progress === undefined) delete pack.progress;
  else pack.progress = progress;
}

/** `count` slices spread evenly between a sample's Start and End. */
const evenSlices = (sampler: { start: number; end: number }, count: number): number[] => Array.from({ length: count }, (_, n) => sampler.start + ((sampler.end - sampler.start) * n) / count);

/** A Simpler's own readings follow its parameters, and its banks follow its mode, as an app's would. */
function simplerFollows(s: PushSet, p: Parameter): void {
  const device = tracksOf(s).flatMap((t) => everyDevice(t.devices)).find((d) => d.sampler && p.id.startsWith(`${d.id}.`));
  const sampler = device?.sampler;
  if (!device || !sampler) return;
  const key = p.id.slice(device.id.length + 1);
  const chosen = p.choices ? Math.round(p.value * (p.choices.length - 1)) : 0;
  if (key === 'mode') sampler.mode = (['classic', 'one-shot', 'slicing'] as const)[chosen];
  else if (key === 'start') sampler.start = p.value;
  else if (key === 'end') sampler.end = p.value;
  else if (key === 'zoom') sampler.zoom = p.value;
  else if (key === 'sliceby') sampler.sliceBy = (['transient', 'beat', 'region', 'manual'] as const)[chosen];
  else if (key === 'playback') sampler.playback = (['mono', 'poly', 'thru'] as const)[chosen];
  else if (key === 'trigger') sampler.trigger = chosen ? 'gate' : 'trigger';
  else if (key === 'padslicing') sampler.padSlicing = p.value >= 0.5;
  else if (key === 'sensitivity') sampler.slices = evenSlices(sampler, Math.max(1, Math.round(p.value * 64)));
  else if (key === 'division') sampler.slices = evenSlices(sampler, [32, 16, 8, 4, 2][chosen]);
  else return;
  // Slicing by beat slices at each division: quarter notes of a two-bar sample until Division says otherwise.
  if (key === 'sliceby' && sampler.sliceBy === 'beat') sampler.slices = evenSlices(sampler, 8);
  if (key === 'mode' || key === 'sliceby') device.banks = simplerBanks(device.id, sampler);
}

/** What the stand-in does for each action it knows, on a copy of the Set. */
const APPLY: Record<string, Apply> = {
  play: (s) => void (s.transport.playing = true),
  stop: (s) => void ((s.transport.playing = false), (s.transport.recording = 'off')),
  metronome: (s, i) => {
    if (typeof i.sound === 'string' && s.transport.click) s.transport.click.sound = i.sound;
    else if (typeof i.rhythm === 'string' && s.transport.click) s.transport.click.rhythm = i.rhythm;
    else s.transport.metronome = typeof i.on === 'boolean' ? i.on : !s.transport.metronome;
  },
  'set-tempo': (s, i) => void (s.transport.tempo = Math.min(999, Math.max(20, Math.round((typeof i.value === 'number' ? i.value : s.transport.tempo + Number(i.delta ?? 0)) * 10) / 10))),
  'set-swing': (s, i) => void (s.transport.swing = Math.min(100, Math.max(0, typeof i.value === 'number' ? i.value : s.transport.swing + Number(i.delta ?? 0)))),
  'select-track': (s, i) => {
    if (track(s, i.track)) s.selection = { ...s.selection, track: String(i.track), device: track(s, i.track)!.devices[0]?.id };
  },
  'select-scene': (s, i) => void (s.selection.scene = Math.min(s.scenes.length - 1, Math.max(0, Number(i.scene)))),
  'select-device': (s, i) => void (s.selection.device = String(i.device)),
  mute: (s, i) => {
    const t = track(s, i.track);
    if (t) t.muted = typeof i.on === 'boolean' ? i.on : !t.muted;
  },
  solo: (s, i) => {
    const t = track(s, i.track);
    if (!t) return;
    const on = typeof i.on === 'boolean' ? i.on : !t.soloed;
    if (on && i.exclusive) for (const other of tracksOf(s)) other.soloed = false;
    t.soloed = on;
  },
  arm: (s, i) => {
    const t = track(s, i.track);
    if (!t) return;
    const on = typeof i.on === 'boolean' ? i.on : !t.armed;
    if (on && i.exclusive) for (const other of s.tracks) other.armed = false;
    t.armed = on;
  },
  'set-parameter': (s, i) => {
    const p = everyParameter(s).find((x) => x.id === i.parameter);
    if (!p || p.disabled) return;
    p.value = clamp01(typeof i.value === 'number' ? i.value : p.value + Number(i.delta ?? 0));
    p.display = word(p);
    simplerFollows(s, p);
  },
  'set-volume': (s, i) => {
    s.unit.volume.value = clamp01(s.unit.volume.value + Number(i.db ?? 0) / 76);
    s.unit.volume.display = `${(s.unit.volume.value * 76 - 70).toFixed(1)} dB`;
  },
  'set-volume-target': (s, i) => void (s.unit.volumeTarget = String(i.target)),
  power: (s, i) => void (s.unit.power = i.on ? 'on' : 'off'),
  'toggle-device': (s, i) => {
    const d = tracksOf(s).flatMap((t) => everyDevice(t.devices)).find((x) => x.id === i.device);
    if (d) d.on = typeof i.on === 'boolean' ? i.on : !d.on;
  },
  'fold-track': (s, i) => {
    const t = track(s, i.track);
    if (t) t.folded = Boolean(i.folded);
  },
  'select-drum-pad': (s, i) => {
    const d = tracksOf(s).flatMap((t) => everyDevice(t.devices)).find((x) => x.id === i.device);
    if (!d) return;
    d.selectedPad = Number(i.note);
    const pad = d.pads?.find((p) => p.note === d.selectedPad);
    if (pad?.devices?.[0] && s.selection.device !== d.id && s.selection.device?.startsWith(`${d.id}.`)) s.selection.device = pad.devices[0].id;
    else if (pad?.devices?.[0] && i.show) s.selection.device = pad.devices[0].id;
  },
  'select-slice': (s, i) => {
    const d = tracksOf(s).flatMap((t) => everyDevice(t.devices)).find((x) => x.id === i.device);
    if (d?.sampler) d.sampler.selectedSlice = Number(i.slice);
  },
  slice: (s, i) => {
    const sampler = tracksOf(s).flatMap((t) => everyDevice(t.devices)).find((x) => x.id === i.device)?.sampler;
    if (!sampler) return;
    if (typeof i.at === 'number') sampler.slices = [...(sampler.slices ?? []), i.at].sort((a, b) => a - b);
    if (typeof i.delete === 'number') sampler.slices = (sampler.slices ?? []).filter((_, n) => n !== i.delete);
  },
  'sample-action': (s, i) => {
    const device = tracksOf(s).flatMap((t) => everyDevice(t.devices)).find((x) => x.id === i.device);
    const sampler = device?.sampler;
    if (!device || !sampler) return;
    if (i.what === 'reverse') sampler.reversed = !sampler.reversed;
    else if (i.what === 'loop' && sampler.loop) {
      sampler.loop.on = !sampler.loop.on;
      device.banks = simplerBanks(device.id, sampler);
    } else if (i.what === 'split-slice') {
      const at = sampler.selectedSlice ?? 0;
      const slices = sampler.slices ?? [];
      sampler.slices = [...slices, ((slices[at] ?? sampler.start) + (slices[at + 1] ?? sampler.end)) / 2].sort((a, b) => a - b);
    }
  },
  'set-drum-pad': (s, i) => {
    const pad = tracksOf(s).flatMap((t) => everyDevice(t.devices)).find((x) => x.id === i.device)?.pads?.find((p) => p.note === i.note);
    if (!pad) return;
    if (typeof i.choke === 'number') pad.choke = i.choke;
    if (typeof i.transpose === 'number') pad.transpose = i.transpose;
    if (typeof i.muted === 'boolean') pad.muted = i.muted;
    if (typeof i.soloed === 'boolean') pad.soloed = i.soloed;
  },
  rename: (s, i) => {
    const t = track(s, i.track);
    if (t && typeof i.text === 'string') t.name = i.text;
  },
  'set-colour': (s, i) => {
    const t = track(s, i.track);
    if (!t || typeof i.colour !== 'number') return;
    if (i.of === 'track') t.colour = i.colour;
    else if (i.of === 'clip') {
      const clip = t.clips[Number(i.scene)];
      if (clip) clip.colour = i.colour;
    } else {
      const pad = everyDevice(t.devices).flatMap((d) => d.pads ?? []).find((p) => p.note === i.note);
      if (pad) pad.colour = i.colour;
    }
  },
  'freeze-track': (s, i) => {
    const t = track(s, i.track);
    if (t) t.frozen = true;
  },
  'flatten-track': (s, i) => {
    const t = track(s, i.track);
    if (t) t.frozen = false;
  },
  'map-macro': (s, i) => {
    const rack = tracksOf(s).flatMap((t) => everyDevice(t.devices)).find((x) => x.id === i.device);
    const macro = rack?.macros?.[Number(i.macro) - 1];
    const p = everyParameter(s).find((x) => x.id === i.parameter);
    if (!macro || !p) return;
    p.macro = Number(i.macro);
    macro.mappings = (macro.mappings ?? 0) + 1;
    // A macro mapped to one thing takes its name; mapped to two, it reads its default name.
    macro.name = macro.mappings === 1 ? p.name : `Macro ${i.macro}`;
  },
  'add-note': (s, i) => {
    const t = track(s, i.track);
    if (!t) return;
    const scene = Number(i.scene);
    t.clips[scene] ??= { name: '', colour: t.colour, kind: 'midi', state: 'stopped', length: 4, loop: { on: true, start: 0, end: 4 }, startMarker: 0, notes: [] };
    const clip = t.clips[scene]!;
    clip.notes ??= [];
    clip.notes.push({ id: `h${clip.notes.length + 1}-${Math.round(Number(i.start) * 1000)}-${i.pitch}`, pitch: Number(i.pitch), start: Number(i.start), length: Number(i.length), velocity: Number(i.velocity ?? 100) });
  },
  'remove-note': (s, i) => {
    const clip = track(s, i.track)?.clips[Number(i.scene)];
    if (clip?.notes) clip.notes = clip.notes.filter((n) => !(i.notes as string[]).includes(n.id));
  },
  'delete-notes': (s, i) => {
    const clip = track(s, i.track)?.clips[Number(i.scene)];
    if (!clip?.notes) return;
    clip.notes = clip.notes.filter((n) => (Array.isArray(i.notes) ? !(i.notes as string[]).includes(n.id) : n.pitch !== i.pitch));
  },
  'mute-notes': (s, i) => {
    for (const n of track(s, i.track)?.clips[Number(i.scene)]?.notes ?? []) if ((i.notes as string[]).includes(n.id)) n.muted = Boolean(i.muted);
  },
  'set-note': (s, i) => {
    for (const n of track(s, i.track)?.clips[Number(i.scene)]?.notes ?? []) {
      if (!(i.notes as string[]).includes(n.id)) continue;
      const change = (key: 'velocity' | 'length' | 'nudge' | 'pitch' | 'velocityRange' | 'probability', low: number, high: number, start = 0) => {
        const v = i[key];
        if (typeof v === 'number') n[key] = Math.min(high, Math.max(low, v));
        else if (v && typeof v === 'object') n[key] = Math.min(high, Math.max(low, (n[key] ?? start) + Number((v as { delta: number }).delta)));
      };
      change('velocity', 1, 127);
      change('length', 0.0625, 64);
      change('nudge', -0.5, 0.5);
      change('pitch', 0, 127);
      change('velocityRange', -127, 127);
      change('probability', 0, 1, 1);
      const position = i.position as { delta: number } | undefined;
      if (position) n.start = Math.max(0, n.start + position.delta);
    }
  },
  'set-loop': (s, i) => {
    const clip = track(s, i.track)?.clips[Number(i.scene)];
    if (!clip) return;
    if (typeof i.start === 'number') clip.loop.start = i.start;
    if (typeof i.end === 'number') clip.loop.end = i.end;
    if (typeof i.on === 'boolean') clip.loop.on = i.on;
    clip.length = Math.max(clip.length, clip.loop.end);
  },
  'set-clip': (s, i) => {
    const clip = track(s, i.track)?.clips[Number(i.scene)];
    if (!clip) return;
    if (typeof i.startMarker === 'number') clip.startMarker = i.startMarker;
    if (typeof i.end === 'number') clip.length = i.end;
    if (typeof i.startAt === 'number') clip.startMarker = i.startAt;
    if (!clip.audio) return;
    if (typeof i.warp === 'boolean') clip.audio.warp = i.warp;
    if (typeof i.warpMode === 'string') clip.audio.warpMode = i.warpMode;
    if (typeof i.transpose === 'number') clip.audio.transpose = i.transpose;
    if (typeof i.detune === 'number') clip.audio.detune = i.detune;
    if (typeof i.gain === 'number') clip.audio.gain = i.gain;
  },
  'clear-steps': (s, i) => {
    const clip = track(s, i.track)?.clips[Number(i.scene)];
    if (clip?.notes) clip.notes = clip.notes.filter((n) => n.start < Number(i.start) || n.start >= Number(i.start) + Number(i.length));
  },
  'copy-steps': (s, i) => {
    const clip = track(s, i.track)?.clips[Number(i.scene)];
    if (!clip?.notes) return;
    const from = Number(i.from);
    const copies = clip.notes.filter((n) => n.start >= from && n.start < from + Number(i.length)).map((n) => ({ ...n, id: `${n.id}-copy${clip.notes!.length}`, start: n.start - from + Number(i.to) }));
    clip.notes.push(...copies);
  },
  'delete-clip': (s, i) => {
    const t = track(s, i.track);
    if (!t) return;
    if (t.playing === Number(i.scene)) delete t.playing;
    t.clips[Number(i.scene)] = null;
  },
  'launch-clip': (s, i) => {
    const t = track(s, i.track);
    const scene = Number(i.scene);
    if (!t?.clips[scene]) return;
    for (const clip of t.clips) if (clip && clip.state !== 'stopped') clip.state = 'stopped';
    t.clips[scene]!.state = 'playing';
    t.clips[scene]!.position = 0;
    t.playing = scene;
    s.transport.playing = true;
  },
  'stop-clip': (s, i) => {
    const t = track(s, i.track);
    if (!t) return;
    for (const clip of t.clips) if (clip) clip.state = 'stopped';
    delete t.playing;
  },
  'stop-all-clips': (s) => {
    for (const t of s.tracks) {
      for (const clip of t.clips) if (clip) clip.state = 'stopped';
      delete t.playing;
    }
  },
  'launch-scene': (s, i) => {
    const scene = Number(i.scene);
    for (const t of s.tracks) {
      for (const clip of t.clips) if (clip) clip.state = 'stopped';
      delete t.playing;
      if (t.clips[scene]) {
        t.clips[scene]!.state = 'playing';
        t.clips[scene]!.position = 0;
        t.playing = scene;
      }
    }
    s.selection.scene = scene;
    s.transport.playing = true;
  },
  'select-clip': (s, i) => {
    if (track(s, i.track)) s.selection = { ...s.selection, track: String(i.track), scene: Number(i.scene) };
  },
  record: (s, i) => {
    const t = track(s, i.track);
    if (i.on === false) {
      s.transport.recording = 'off';
      for (const any of s.tracks) for (const clip of any.clips) if (clip?.state === 'recording') clip.state = 'playing';
      return;
    }
    s.transport.recording = 'session';
    s.transport.playing = true;
    if (!t || typeof i.scene !== 'number') return;
    t.clips[i.scene] = { name: '', colour: t.colour, kind: t.kind === 'audio' ? 'audio' : 'midi', state: 'recording', length: 4, loop: { on: true, start: 0, end: 4 }, position: 0, ...(t.kind === 'audio' ? {} : { notes: [] }) };
    t.playing = i.scene;
  },
  'record-clip': (s, i) => APPLY.record(s, { ...i, on: true }),
  'record-arrangement': (s, i) => void (s.transport.recording = i.on ? 'arrangement' : 'off'),
  overdub: (s, i) => void (s.transport.overdub = Boolean(i.on)),
  'automation-arm': (s, i) => void (s.transport.automationArm = Boolean(i.on)),
  'fixed-length': (s, i) => void (s.transport.fixedLength.on = Boolean(i.on)),
  'set-fixed-length': (s, i) => {
    if (typeof i.bars === 'string') s.transport.fixedLength.bars = i.bars;
    if (typeof i.phrase === 'boolean') s.transport.fixedLength.phrase = i.phrase;
  },
  'set-quantize': (s, i) => {
    const q = s.transport.quantize;
    if (typeof i.to === 'string') q.to = i.to;
    if (typeof i.amount === 'number') q.amount = i.amount;
    if (typeof i.swing === 'number') q.swing = i.swing;
    if (typeof i.record === 'string') q.recordTo = i.record;
  },
  'set-count-in': (s, i) => void (s.transport.countIn = i.value as PushSet['transport']['countIn']),
  'set-signature': (s, i) => void (s.transport.signature = [Number(i.numerator), Number(i.denominator)]),
  preview: (s, i) => {
    if (typeof i.on === 'boolean') s.browser.preview = i.on;
    else if (typeof i.item === 'string') s.browser.previewing = i.item;
  },
  favourite: (s, i) => {
    const mark = (items: BrowserItem[]) => {
      for (const item of items) {
        if (item.id === i.item) item.favourite = Boolean(i.on);
        if (item.children) mark(item.children);
      }
    };
    mark(s.browser.roots);
  },
  load: (s, i) => {
    const t = track(s, i.track);
    if (!t || typeof i.item !== 'string') return;
    const name = (function find(items: BrowserItem[]): string | undefined {
      for (const item of items) {
        if (item.id === i.item) return item.name;
        const inside = item.children && find(item.children);
        if (inside) return inside;
      }
      return undefined;
    })(s.browser.roots);
    const selected = everyDevice(t.devices).find((d) => d.id === s.selection.device);
    // A swap replaces what is selected (here, its name); a load adds a device to the track.
    if (i.replace && selected) {
      selected.name = name ?? selected.name;
      selected.preset = name;
      s.browser.hotSwapItem = i.item;
    } else {
      const device = { id: `loaded-${t.devices.length + 1}`, name: name ?? 'Device', kind: i.content === 'audio-effect' ? ('audio-effect' as const) : ('instrument' as const), on: true, banks: [] };
      t.devices.push(device);
      s.selection.device = device.id;
    }
  },
  'download-pack': (s, i) => packState(s, i.pack, 'downloading', 0.1),
  'pause-pack': (s, i) => packState(s, i.pack, 'paused'),
  'install-pack': (s, i) => packState(s, i.pack, 'installing', 0),
  'cancel-pack': (s, i) => packState(s, i.pack, 'available'),
  'delete-pack-download': (s, i) => packState(s, i.pack, 'available'),
  'uninstall-pack': (s, i) => packState(s, i.pack, 'available'),
  'rename-file': (s, i) => {
    const file = s.sets.find((x) => x.id === i.set);
    if (file && typeof i.text === 'string') file.name = i.text;
  },
  'delete-file': (s, i) => void (s.sets = s.sets.filter((x) => x.id !== i.set)),
  'open-set': (s, i) => {
    for (const file of s.sets) file.current = file.id === i.set;
  },
  'set-monitor': (s, i) => {
    const t = track(s, i.track);
    if (t?.routing) t.routing.monitor = i.monitor as 'in' | 'auto' | 'off';
  },
  'set-routing': (s, i) => {
    const t = track(s, i.track);
    if (!t?.routing) return;
    const { kind: _k, action: _a, track: _t, ...change } = i;
    Object.assign(t.routing, change);
  },
  'set-scale': (s, i) => {
    const { kind: _k, action: _a, ...change } = i;
    Object.assign(s.scale, change);
  },
};

/** The Set after the stand-in host has done what `intent` asks; the same Set when it does not know the action. */
export function applyIntent(set: PushSet, intent: PushIntent): PushSet {
  const apply = APPLY[intent.action];
  if (!apply) return set;
  const next = copy(set);
  apply(next, intent);
  return next;
}

/** The actions the stand-in host answers. */
export const hostActions = (): string[] => Object.keys(APPLY);
