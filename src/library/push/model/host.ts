// A stand-in host: the smallest app that answers the device. `applyIntent` takes a Set and one
// intent and returns the Set that results, or the same Set for an intent it does not know. The
// stories, the tests and the emulator's first run use it; a real app replaces it with its own
// engine. It is also the reference for what each intent means.
import { everyDevice } from './state';
import type { Parameter, PushIntent, PushSet, Track } from './types';

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

/** What the stand-in does for each action it knows, on a copy of the Set. */
const APPLY: Record<string, Apply> = {
  play: (s) => void (s.transport.playing = true),
  stop: (s) => void ((s.transport.playing = false), (s.transport.recording = 'off')),
  metronome: (s, i) => void (s.transport.metronome = typeof i.on === 'boolean' ? i.on : !s.transport.metronome),
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
    if (pad?.devices?.[0]) s.selection.device = pad.devices[0].id;
  },
  'set-drum-pad': (s, i) => {
    const pad = tracksOf(s).flatMap((t) => everyDevice(t.devices)).find((x) => x.id === i.device)?.pads?.find((p) => p.note === i.note);
    if (!pad) return;
    if (typeof i.choke === 'number') pad.choke = i.choke;
    if (typeof i.transpose === 'number') pad.transpose = i.transpose;
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
