// Story harness only: port of widgets/stories/usePreviewMixer.ts, not a playback engine.
import { useEffect, useRef, useState, useCallback } from 'react';
import type { MixerState, MixerCommands, MixerFrame } from '../mixer/model';
import {
  createPreviewState, previewDeckIds as deckIds, previewSectionIds as sectionIds,
  previewStemIds, previewParams,
} from './previewMixer';

export { previewParams } from './previewMixer';

/** Injectable only so the preview's clock/lifecycle can be exercised without wall-clock waits. */
export interface PreviewClock {
  now(): number;
  requestFrame(callback: FrameRequestCallback): number;
  cancelFrame(handle: number): void;
}
const browserClock: PreviewClock = {
  now: () => performance.now(),
  requestFrame: callback => requestAnimationFrame(callback),
  cancelFrame: handle => cancelAnimationFrame(handle),
};
export interface PreviewMixerOptions {
  clock?: PreviewClock;
  initialBeat?: number;
}
interface DeckState {
  loop: { start: number | null; end: number | null; enabled: boolean };
  positionOffset: number;
  full: boolean;
  fullSection: number;
  fullQueued: number | null;
  active: number[];
  queued: (number | null)[];
  levels: number[];
  gain: number; trim: number; sendA: number; sendB: number; eq: number[];
  filter: number; filterResonance: number; route: number; cue: boolean;
}
const initialDecks = (): DeckState[] => deckIds.map((_, i) => ({
  loop: { start: null, end: null, enabled: false }, positionOffset: 0,
  full: false, fullSection: 3, fullQueued: null,
  active: [3, 3, 3, 3], queued: [null, null, null, null], levels: [85, 78, 66, 82],
  gain: i < 2 ? 80 : 0, trim: 0, sendA: 0, sendB: 0, eq: [0, 0, 0],
  filter: 0, filterResonance: 0, route: i % 2 ? 2 : 0, cue: false,
}));
const stemIds = previewStemIds.slice(0, 4);
const sectionId = (index: number) => sectionIds[index] ?? null;
const queuedId = (index: number | null) => index === null ? undefined : sectionId(index);
const opening = createPreviewState();

export function usePreviewMixer({ clock: timer = browserClock, initialBeat = 0 }: PreviewMixerOptions = {}) {
  const [decks, setDecks] = useState(initialDecks);
  const [running, setRunning] = useState(false);
  const [clock, setClock] = useState(() => ({ beat: Math.floor(initialBeat), tick: 0 }));
  const beat = clock.beat;
  const phase = useRef({ beat: initialBeat, tick: 0 });
  const [loop, setLoop] = useState<MixerState['loop']>({ start: null, end: null, enabled: false });
  const [fxA, setFxA] = useState(opening.fxA);
  const [fxB, setFxB] = useState(opening.fxB);
  const [bpm, setBpm] = useState(124);
  const [cross, setCross] = useState(0);
  const [master, setMaster] = useState(80);
  const [masterTrim, setMasterTrim] = useState(0);
  const [masterFilter, setMasterFilter] = useState(0);
  const [masterSendA, setMasterSendA] = useState(0);
  const [masterSendB, setMasterSendB] = useState(0);
  const [masterEq, setMasterEq] = useState([0, 0, 0]);
  const [launchBeats, setLaunchBeats] = useState(4);
  const [quantize, setQuantize] = useState(0);
  const [loopBeats, setLoopBeats] = useState(8);

  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let active = true;
    let previous = timer.now();
    const advance = (now: number) => {
      if (!active) return;
      const elapsed = Math.max(0, Math.min(100, now - previous)) * bpm / 60000;
      previous = now;
      phase.current.tick += elapsed;
      phase.current.beat += elapsed;
      if (loop.enabled && loop.start !== null && loop.end !== null && loop.end > loop.start && phase.current.beat >= loop.end) {
        phase.current.beat = loop.start + (phase.current.beat - loop.start) % (loop.end - loop.start);
      }
      const next = { tick: Math.floor(phase.current.tick), beat: Math.floor(phase.current.beat) };
      setClock(c => c.tick === next.tick && c.beat === next.beat ? c : next);
      frame = timer.requestFrame(advance);
    };
    frame = timer.requestFrame(advance);
    return () => { active = false; timer.cancelFrame(frame); };
  }, [running, bpm, loop, timer]);

  const flushQueued = () => setDecks(all => all.map(d => ({
    ...d, fullSection: d.fullQueued ?? d.fullSection, fullQueued: null,
    active: d.active.map((a, i) => d.queued[i] ?? a), queued: [null, null, null, null],
  })));
  useEffect(() => {
    if (clock.tick === 0 || launchBeats <= 0 || clock.tick % launchBeats !== 0) return;
    flushQueued();
  }, [clock.tick, launchBeats]);

  const deckBeat = (d: Pick<DeckState, 'loop' | 'positionOffset'>) => {
    const at = phase.current.beat + d.positionOffset;
    const { start, end, enabled } = d.loop;
    return enabled && start !== null && end !== null && end > start
      ? start + ((at - start) % (end - start) + end - start) % (end - start) : at;
  };
  const update = (deck: number, patch: Partial<DeckState>) => setDecks(all => all.map((d, i) => i === deck ? { ...d, ...patch } : d));
  const launch = (deck: number, section: number, stem?: number) => setDecks(all => all.map((d, i) => {
    if (i !== deck) return d;
    const waiting = running && launchBeats > 0;
    if (section >= 0) d = {
      ...d, positionOffset: section * 16 - phase.current.beat,
      loop: stem === undefined ? { start: null, end: null, enabled: false } : { start: section * 16, end: (section + 1) * 16, enabled: true },
    };
    if (d.full) return { ...d, fullSection: waiting ? d.fullSection : section, fullQueued: waiting ? section : null };
    return {
      ...d,
      active: d.active.map((a, s) => !waiting && (stem === undefined || s === stem) ? section : a),
      queued: d.queued.map((q, s) => stem === undefined || s === stem ? (waiting ? section : null) : q),
    };
  }));
  const stopAll = () => {
    setRunning(false);
    phase.current = { beat: 0, tick: 0 };
    setClock({ beat: 0, tick: 0 });
    setLoop({ start: null, end: null, enabled: false });
    setDecks(all => all.map(d => ({
      ...d, positionOffset: 0, loop: { start: null, end: null, enabled: false },
      fullSection: -1, fullQueued: null, active: [-1, -1, -1, -1], queued: [null, null, null, null],
    })));
  };
  const deckLevel = (d: DeckState) => {
    const weight = d.route === 1 ? 1 : d.route === 0 ? Math.min(1, (100 - cross) / 100) : Math.min(1, (100 + cross) / 100);
    return running ? (d.full ? (d.fullSection < 0 ? 0 : 0.8) : d.levels.reduce((sum, v, s) => sum + (d.active[s] < 0 ? 0 : v / 400), 0)) *
      10 ** (d.trim / 20) * d.gain / 100 * weight *
      (0.68 + 0.2 * Math.exp(-5 * (phase.current.beat % 1)) + 0.05 * Math.sin(phase.current.beat * 7.3)) : 0;
  };

  const state: MixerState = {
    ...opening,
    decks: decks.map(({ active, queued, levels, ...d }, index) => ({
      ...opening.decks[index], ...d, playing: running,
      canLoopOut: d.loop.start !== null && d.loop.end === null && deckBeat(d) > d.loop.start,
      stems: opening.decks[index].stems.map((stem, i) => ({ ...stem, level: levels[i], selected: sectionId(active[i]), queued: queuedId(queued[i]) })),
      fullSection: sectionId(d.fullSection), fullQueued: queuedId(d.fullQueued),
    })),
    running, beat, loop, canLoopOut: loop.start !== null && beat > loop.start,
    bpm, launchBeats, quantize, loopBeats, cross, master, masterTrim, masterFilter, masterSendA, masterSendB, masterEq,
    fxA, fxB,
  };
  const commands: MixerCommands = {
    setRunning, stopAll,
    deckLoopIn: id => {
      const i = deckIds.indexOf(id);
      if (i >= 0) {
        const at = deckBeat(decks[i]);
        update(i, { positionOffset: at - phase.current.beat, loop: { start: at, end: null, enabled: false } });
      }
    },
    deckLoopOut: id => {
      const i = deckIds.indexOf(id);
      if (i >= 0 && decks[i].loop.start !== null && deckBeat(decks[i]) > decks[i].loop.start!) {
        update(i, { loop: { ...decks[i].loop, end: deckBeat(decks[i]), enabled: true } });
      }
    },
    setDeckLoopEnabled: (id, enabled) => {
      const i = deckIds.indexOf(id);
      if (i >= 0) update(i, {
        positionOffset: (enabled ? decks[i].loop.start ?? deckBeat(decks[i]) : deckBeat(decks[i])) - phase.current.beat,
        loop: { ...decks[i].loop, enabled },
      });
    },
    setLoopBeats, setQuantize,
    setLaunchBeats: beats => { setLaunchBeats(beats); if (!beats) flushQueued(); },
    loopIn: () => setLoop({ start: beat, end: null, enabled: false }),
    loopOut: () => { if (loop.start !== null && beat > loop.start) setLoop(l => ({ ...l, end: beat, enabled: true })); },
    setLoopEnabled: enabled => {
      setLoop(l => ({ ...l, enabled }));
      if (enabled && loop.start !== null) {
        phase.current.beat = loop.start;
        setClock(c => ({ ...c, beat: loop.start! }));
      }
    },
    setEffect: (slot, id) => {
      if (opening.effects.some(effect => effect.id === id)) (slot === 'A' ? setFxA : setFxB)(id);
    },
    setMaster: (control, value) => ({
      bpm: setBpm, cross: setCross, master: setMaster, masterTrim: setMasterTrim,
      masterFilter: setMasterFilter, masterSendA: setMasterSendA, masterSendB: setMasterSendB,
    })[control](value),
    setMasterEq: (band, value) => setMasterEq(all => all.map((v, i) => i === band ? value : v)),
    setDeck: (id, control, value) => {
      const index = deckIds.indexOf(id);
      if (index < 0) return;
      const d = decks[index];
      if (control === 'full') update(index, {
        full: !!value, ...(value ? { fullSection: d.active.find(section => section >= 0) ?? -1, fullQueued: null } : {}),
      });
      else update(index, { [control]: value });
    },
    setDeckEq: (id, band, value) => {
      const i = deckIds.indexOf(id);
      if (i >= 0) update(i, { eq: decks[i].eq.map((v, e) => e === band ? value : v) });
    },
    setStemLevel: (id, stem, value) => {
      const i = deckIds.indexOf(id), s = stemIds.indexOf(stem);
      if (i >= 0 && s >= 0) update(i, { levels: decks[i].levels.map((v, e) => e === s ? value : v) });
    },
    launch: (id, section, stem) => {
      const i = deckIds.indexOf(id), s = stem === undefined ? undefined : stemIds.indexOf(stem);
      if (i >= 0 && (s === undefined || s >= 0) && (section === null || sectionIds.includes(section))) {
        launch(i, section === null ? -1 : sectionIds.indexOf(section), s);
      }
    },
  };

  // The reader's identity never changes, and sampling never advances the clock.
  const sample = useRef<() => MixerFrame>(() => ({ decks: {}, masterLevel: 0 }));
  sample.current = () => ({
    decks: Object.fromEntries(decks.map((d, i) => [deckIds[i], { beat: deckBeat(d), level: deckLevel(d) }])),
    masterLevel: Math.min(1, decks.reduce((sum, d) => sum + deckLevel(d), 0) * 10 ** (masterTrim / 20) * master / 100),
  });
  const readFrame = useCallback(() => sample.current(), []);
  return { state, commands, readFrame, params: previewParams };
}
