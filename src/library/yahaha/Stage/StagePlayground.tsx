import { useEffect, useMemo, useState } from 'react';
import type { BankLamp, FaderStrip } from '../FaderBank/FaderBank';
import { styleStrips } from '../FaderBank/FaderBank.fixtures';
import type { KnobItem } from '../KnobBank/KnobBank';
import type { PadItem } from '../PadBank/PadBank';
import { SECTION_LABEL, type SectionId } from '../SongForm/SongForm';
import { Stage, TEMPO_MAX, TEMPO_MIN, type StageProps } from './Stage';
import { stageKnobPages, stagePadBanks, stageStyles, stageStyleTempo, withTempo } from './Stage.fixtures';

export interface StagePlaygroundProps extends StageProps {
  /** Every press, logged with its arguments (the story's Actions panel). */
  log?: (event: string, ...args: unknown[]) => void;
  /** While running, step the beat at the tempo (a story-only ticker). Off in tests. */
  tick?: boolean;
}

/** The non-Vol layers: the word at the top of a part strip and in its spoken name, its tooltip key. */
const LAYERS: Record<string, { short: string; word: string; tip: string }> = {
  pan: { short: 'Pan', word: 'Pan', tip: 'mixer.part.pan' },
  reverb: { short: 'Rev', word: 'Reverb', tip: 'mixer.part.reverb' },
  chorus: { short: 'Cho', word: 'Chorus', tip: 'mixer.part.chorus' },
  delay: { short: 'Dly', word: 'Delay', tip: 'mixer.part.variation' },
};
/** The layers' starting values for strips 1–4 (Vol comes from the strips themselves). */
const LAYER_SEED: Record<string, number[]> = {
  pan: [64, 40, 88, 64],
  reverb: [40, 12, 0, 20],
  chorus: [12, 0, 0, 8],
  delay: [0, 0, 0, 0],
};
const MAINS: SectionId[] = ['mainA', 'mainB', 'mainC', 'mainD'];
const BARS = 4;

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));
const panText = (v: number) => (v === 64 ? 'C' : v < 64 ? `L${64 - v}` : `R${v - 64}`);
const lampsOn = (lamps: BankLamp[]) => Object.fromEntries(lamps.map((lamp) => [lamp.id, lamp.on]));
/** The One Touch an "OTS 1"–"OTS 4" pad applies; 0 for any other pad. */
const otsNumber = (pad: PadItem | undefined) => Number(pad?.label.match(/^OTS\s(\d)$/)?.[1] ?? 0);

/**
 * StagePlayground: a story-only wrapper that keeps what the controls change, so the whole screen is
 * live in Storybook. It is seeded from the Stage's props and renders the Stage with its state.
 *
 * - Page tabs choose; Metronome and its ▾ popover, Unison and ? switch; Panic writes the status line.
 * - Sections (the Pads region's Sections bank, its default view): stopped, a press picks where the
 *   band starts; running, it queues as next (the pad's accent ring, "→ Main C" on the hero), and lands at the end of the four-bar phrase, or at once on a
 *   second press. A landed Ending stops the band. Fill ▲ ▼ queue a fill and the next Main.
 * - Start / Stop runs and stops; while running the beat moves at the tempo.
 * - Tempo − + step it, a drag or wheel on the number sets it, Style tempo goes back to the style's
 *   tempo (104; unavailable while the tempo already is that), and Tap
 *   (timed by the Stage) sets it from two or more taps; the Tempo knob follows.
 * - One Touch applies, from the hero or from the OTS 1–4 pads (the hardware mirror), and both show
 *   the one applied; ‹ › step through a few styles (a 3/4 waltz among them), wrapping at either end.
 *   A seed style the list doesn't hold shows as given, and › from it goes to the first, ‹ to the last.
 * - Faders move on every layer (each keeps its own values), Panel / Style pages and the page button
 *   switch, part lamps turn a part off (its strip dims), knob and pad pages switch, knobs turn, pads toggle.
 * - The Sections pads are the song form's (the Stage draws them from the form's state and sends
 *   their presses to its callbacks), so a section pad queues, lands and starts exactly as a
 *   SongForm step would, and Sync Start, Auto Fill, Sync Stop, Tap and Start / Stop act as their keys do.
 */
export function StagePlayground({ log, tick = true, ...seed }: StagePlaygroundProps) {
  const say = (event: string, ...args: unknown[]) => log?.(event, ...args);

  // ---- App bar
  const [chosen, setChosen] = useState(seed.appBar.chosen ?? 'stage');
  const [metronome, setMetronome] = useState(seed.appBar.metronome ?? false);
  const [metronomeOpen, setMetronomeOpen] = useState(seed.appBar.metronomeOpen ?? false);
  const [metronomeVolume, setMetronomeVolume] = useState(seed.appBar.metronomeVolume ?? 90);
  const [metronomeBell, setMetronomeBell] = useState(seed.appBar.metronomeBell ?? true);
  const [unison, setUnison] = useState(seed.appBar.unison ?? false);
  const [help, setHelp] = useState(seed.appBar.help ?? false);
  const [status, setStatus] = useState(seed.status);
  const message = (text: string) => setStatus((s) => ({ ...s, text, error: false, seq: (s.seq ?? 0) + 1 }));

  // ---- Style and tempo
  // -1: the seed's own style, one the list doesn't hold; it shows as given until ‹ › step away.
  const [styleAt, setStyleAt] = useState(() => stageStyles.findIndex((s) => s.name === seed.display.style.name));
  const listed = stageStyles[styleAt];
  const [oneTouch, setOneTouch] = useState(seed.display.style.oneTouch ?? 0);
  const oneTouchCount = seed.display.style.oneTouchCount ?? 4;
  const [bpm, setBpm] = useState(seed.display.nowPlaying.bpm);
  const styleTempo = seed.display.nowPlaying.styleTempo ?? stageStyleTempo;
  const setTempo = (n: number) => setBpm(clamp(Math.round(n), TEMPO_MIN, TEMPO_MAX));

  // ---- Song form and transport
  const sf = seed.songForm;
  const [running, setRunning] = useState(sf.running ?? false);
  const [playing, setPlaying] = useState<SectionId | undefined>(sf.playing);
  const [next, setNext] = useState<SectionId | undefined>(sf.next);
  const [fillPending, setFillPending] = useState(sf.fillPending);
  const [accomp, setAccomp] = useState(sf.accomp ?? false);
  const [syncStart, setSyncStart] = useState(sf.syncStart ?? false);
  const [syncStop, setSyncStop] = useState(sf.syncStop ?? false);
  const [autoFill, setAutoFill] = useState(sf.autoFill ?? false);
  const [fading, setFading] = useState(sf.fading ?? false);
  const absent = useMemo(() => new Set(sf.absent ?? []), [sf.absent]);
  // Where the band is: the bar of the phrase and the beat; `rolled` when the phrase just began again.
  const [pos, setPos] = useState({ bar: seed.display.nowPlaying.bar ?? 1, beat: seed.display.nowPlaying.beat ?? 1, rolled: false });
  const beats = listed?.beats ?? seed.display.nowPlaying.beats ?? 4;
  const restart = () => setPos({ bar: 1, beat: 1, rolled: false });

  const stop = () => {
    setRunning(false);
    setNext(undefined);
    setFillPending(undefined);
    setFading(false);
  };
  const land = (id: SectionId) => {
    setPlaying(id);
    setNext(undefined);
    setFillPending(undefined);
    restart();
    if (id.startsWith('ending')) {
      stop();
      setPlaying('mainA');
      message(`${SECTION_LABEL[id]} played out: the band stopped`);
    }
  };

  // The story-only ticker: one beat at the tempo; at the end of the phrase what's queued lands.
  useEffect(() => {
    if (!tick || !running) return;
    const timer = setInterval(
      () =>
        setPos((p) =>
          p.beat >= beats ? { bar: p.bar >= BARS ? 1 : p.bar + 1, beat: 1, rolled: p.bar >= BARS } : { ...p, beat: p.beat + 1, rolled: false },
        ),
      60000 / bpm,
    );
    return () => clearInterval(timer);
  }, [tick, running, bpm, beats]);
  useEffect(() => {
    if (pos.rolled && running && next) land(next);
  }, [pos]);

  const onSection = (id: SectionId) => {
    say('songForm.onSection', id);
    if (!running) {
      setPlaying(id);
      setNext(undefined);
    } else if (id === next) land(id);
    else if (id !== playing) {
      setNext(id);
      setFillPending(undefined);
    }
  };
  const nextMain = (way: 1 | -1) => {
    const present = MAINS.filter((m) => !absent.has(m));
    const at = present.indexOf(playing as SectionId);
    return present[clamp(at + way, 0, present.length - 1)];
  };
  const onFill = (way: 'up' | 'down') => {
    say(`songForm.onFill${way === 'up' ? 'Up' : 'Down'}`);
    if (!running) return message('A fill plays only while the band runs');
    setFillPending(way);
    setNext(nextMain(way === 'up' ? 1 : -1));
  };

  // ---- Faders
  const [faderPage, setFaderPage] = useState(seed.faders.page);
  const [layer, setLayer] = useState(seed.faders.layer);
  const [volumes, setVolumes] = useState<Record<string, number>>(() =>
    Object.fromEntries([...seed.faders.strips, ...styleStrips].map((s) => [s.id, s.level])),
  );
  const [layerValues, setLayerValues] = useState(() => {
    const seeded = Object.fromEntries(Object.entries(LAYER_SEED).map(([id, list]) => [id, [...list]]));
    if (seed.faders.layer !== 'volume') seeded[seed.faders.layer] = seed.faders.strips.slice(0, 4).map((s) => s.level);
    return seeded;
  });
  const [partOn, setPartOn] = useState(() => lampsOn(seed.faders.partLamps));
  const [functionOn, setFunctionOn] = useState(() => lampsOn(seed.faders.functionLamps));

  const strips: FaderStrip[] = useMemo(() => {
    if (faderPage === 'style') return styleStrips.map((s) => ({ ...s, level: volumes[s.id] ?? s.level, value: `${volumes[s.id] ?? s.level}` }));
    // The Panel page's own strips: on a non-Vol layer the seed holds that layer's values, so start
    // from the Vol strips' shape and fill in the layer chosen here.
    return seed.faders.strips.map((strip, i) => {
      const isPart = i < 4 && (strip.kind === 'part' || strip.kind === 'off');
      const kind = isPart ? (partOn[strip.id] === false ? 'off' : 'part') : strip.kind;
      const base = strip.faderName.split(',')[0];
      const look = i < 4 ? LAYERS[layer] : undefined;
      if (look) {
        const v = layerValues[layer]?.[i] ?? 0;
        const text = layer === 'pan' ? panText(v) : `${v}`;
        return { ...strip, kind, level: v, value: `${look.short} ${text}`, away: undefined, faderName: `${base}, ${look.word} ${text}`, tip: look.tip };
      }
      if (strip.kind === 'parked') return strip;
      const v = volumes[strip.id] ?? strip.level;
      const away = strip.away === undefined || strip.away === v ? '' : ', hardware fader away (soft takeover)';
      return {
        ...strip,
        kind,
        level: v,
        value: `${v}`,
        away: strip.away === v ? undefined : strip.away,
        faderName: `${base}, level ${v}${kind === 'off' ? ', off' : ''}${away}`,
        tip: isPart ? `mixer.panel.${strip.id}` : strip.tip,
      };
    });
  }, [faderPage, layer, volumes, layerValues, partOn, seed.faders.strips]);

  const onLevel = (id: string, level: number) => {
    say('faders.onLevel', id, level);
    const i = seed.faders.strips.findIndex((s) => s.id === id);
    if (faderPage === 'panel' && layer !== 'volume' && i >= 0 && i < 4) {
      setLayerValues((all) => ({ ...all, [layer]: (all[layer] ?? []).map((v, j) => (j === i ? level : v)) }));
    } else setVolumes((all) => ({ ...all, [id]: level }));
  };
  const onLamp = (id: string, on: boolean) => {
    say('faders.onLamp', id, on);
    if (id in partOn) setPartOn((all) => ({ ...all, [id]: on }));
    else setFunctionOn((all) => ({ ...all, [id]: on }));
  };
  const partLamps = seed.faders.partLamps.map((lamp) => {
    const on = partOn[lamp.id] ?? lamp.on;
    return { ...lamp, on, label: on ? 'On' : 'Off', name: lamp.name?.replace(/ (on|off)\./, ` ${on ? 'on' : 'off'}.`) };
  });
  const functionLamps = seed.faders.functionLamps.map((lamp) => ({ ...lamp, on: functionOn[lamp.id] ?? lamp.on }));

  // ---- Knobs
  const [knobPage, setKnobPage] = useState(seed.knobs.page ?? 0);
  const [knobPages, setKnobPages] = useState<KnobItem[][]>(() => stageKnobPages.map((page) => page.map((k) => ({ ...k }))));
  const knobs = withTempo(knobPages[knobPage] ?? seed.knobs.knobs, bpm);
  const onStep = (index: number, delta: number) => {
    say('knobs.onStep', index, delta);
    const knob = knobs[index];
    if (!knob || knob.unused) return;
    if (knob.label === 'Tempo') return setTempo(bpm + delta);
    const n = Number(knob.value);
    if (!Number.isFinite(n) || knob.value === '') return;
    const v = clamp(n + delta, 0, 127);
    setKnobPages((pages) => pages.map((page, p) => (p !== knobPage ? page : page.map((k, i) => (i === index ? { ...k, value: `${v}`, fraction: v / 127 } : k)))));
  };

  // ---- Pads
  const [padBank, setPadBank] = useState(seed.pads.bank ?? 0);
  const [padBanks, setPadBanks] = useState<PadItem[][]>(() => stagePadBanks.map((bank) => bank.map((p) => ({ ...p }))));
  const shownPads = (padBanks[padBank] ?? seed.pads.pads).map((pad) => {
    const n = otsNumber(pad);
    if (!n) return pad;
    return { ...pad, state: n > oneTouchCount ? 'dark' : n === oneTouch ? 'playing' : 'idle' } satisfies PadItem;
  });
  const onPad = (index: number) => {
    say('pads.onPress', index);
    // OTS 1–4 apply One Touch, as the Launchkey's pads 9–12 do: the same setting the hero shows.
    const ots = otsNumber(shownPads[index]);
    if (ots) {
      if (ots <= oneTouchCount) setOneTouch(ots);
      return;
    }
    setPadBanks((banks) =>
      banks.map((bank, b) =>
        b !== padBank ? bank : bank.map((p, i) => (i === index && p.state !== 'dark' ? { ...p, state: p.state === 'playing' ? 'idle' : 'playing' } : p)),
      ),
    );
  };

  // ---- The screen
  const nextAt = next ? `after bar ${BARS}` : undefined;
  /** ‹ › wrap around the list; from the seed's own style, › goes to the first and ‹ to the last. */
  const stepStyle = (way: 1 | -1) => {
    const from = styleAt >= 0 ? styleAt : way === 1 ? -1 : 0;
    const at = (from + way + stageStyles.length) % stageStyles.length;
    setStyleAt(at);
    setOneTouch(0);
    setPos((p) => ({ ...p, beat: Math.min(p.beat, stageStyles[at].beats) }));
  };

  return (
    <Stage
      {...seed}
      appBar={{
        ...seed.appBar,
        chosen,
        onChoose: (id) => (say('appBar.onChoose', id), setChosen(id)),
        metronome,
        onMetronome: (on) => (say('appBar.onMetronome', on), setMetronome(on)),
        metronomeOpen,
        onMetronomeSettings: () => (say('appBar.onMetronomeSettings'), setMetronomeOpen((o) => !o)),
        onMetronomeClose: () => setMetronomeOpen(false),
        metronomeVolume,
        onMetronomeVolume: setMetronomeVolume,
        metronomeBell,
        onMetronomeBell: setMetronomeBell,
        unison,
        onUnison: (on) => (say('appBar.onUnison', on), setUnison(on)),
        help,
        onHelp: (on) => (say('appBar.onHelp', on), setHelp(on)),
        onPanic: () => (say('appBar.onPanic'), message('Panic: all notes off')),
        onHealth: (target) => (say('appBar.onHealth', target), message(`Opens ${target}`)),
      }}
      display={{
        style: {
          ...seed.display.style,
          ...(listed && { name: listed.name, category: listed.category, timeSignature: listed.timeSignature }),
          oneTouch,
        },
        nowPlaying: {
          ...seed.display.nowPlaying,
          playing: playing ? SECTION_LABEL[playing] : '',
          next: next ? SECTION_LABEL[next] : '',
          fill: next ? `${fillPending ? 'fill ' : ''}after bar ${BARS}` : '',
          bar: pos.bar,
          bars: BARS,
          bpm,
          styleTempo,
          running,
          syncStart,
          beat: running ? pos.beat : 0,
          beats,
        },
        onPrev: () => (say('display.onPrev'), stepStyle(-1)),
        onNext: () => (say('display.onNext'), stepStyle(1)),
        onBrowse: () => (say('display.onBrowse'), message('Library › Styles would open here')),
        onOneTouch: (n) => (say('display.onOneTouch', n), setOneTouch(n)),
        onTempoUp: (down) => (say('display.onTempoUp', down), down && setTempo(bpm + 1)),
        onTempoDown: (down) => (say('display.onTempoDown', down), down && setTempo(bpm - 1)),
        onTempo: (n) => (say('display.onTempo', n), setTempo(n)),
        onTap: () => say('display.onTap'),
        onStyleTempo: () => (say('display.onStyleTempo'), setTempo(styleTempo)),
      }}
      songForm={{
        ...sf,
        running,
        playing,
        next,
        nextAt,
        fillPending,
        accomp,
        syncStart,
        syncStop,
        autoFill,
        fading,
        onSection,
        onStartStop: () => {
          say('songForm.onStartStop');
          if (running) return stop();
          setRunning(true);
          setSyncStart(false);
          restart();
        },
        onStopWithFade: () => (say('songForm.onStopWithFade'), stop()),
        onAccomp: (on) => (say('songForm.onAccomp', on), setAccomp(on)),
        onSyncStart: (on) => (say('songForm.onSyncStart', on), setSyncStart(on)),
        onSyncStop: (on) => (say('songForm.onSyncStop', on), setSyncStop(on)),
        onAutoFill: (on) => (say('songForm.onAutoFill', on), setAutoFill(on)),
        onFillUp: () => onFill('up'),
        onFillDown: () => onFill('down'),
        onFade: () => (say('songForm.onFade'), setFading((f) => !f)),
        onReset: () => (say('songForm.onReset'), restart(), message(`Section reset: ${playing ? SECTION_LABEL[playing] : 'the section'} from bar 1`)),
      }}
      faders={{
        ...seed.faders,
        strips,
        page: faderPage,
        layer,
        partLamps,
        functionLamps,
        onChoosePage: (id) => (say('faders.onChoosePage', id), setFaderPage(id)),
        onChooseLayer: (id) => (say('faders.onChooseLayer', id), setLayer(id)),
        onLevel,
        onOpen: (id) => (say('faders.onOpen', id), message(`Opens ${id}`)),
        onLamp,
        onPageButton: () => (say('faders.onPageButton'), setFaderPage((p) => (p === 'panel' ? 'style' : 'panel'))),
      }}
      knobs={{
        ...seed.knobs,
        knobs,
        page: knobPage,
        onPage: (i) => (say('knobs.onPage', i), setKnobPage(i)),
        onPress: (i) => say('knobs.onPress', i),
        onStep,
      }}
      pads={{
        ...seed.pads,
        pads: shownPads,
        bank: padBank,
        onBank: (i) => (say('pads.onBank', i), setPadBank(i)),
        onPress: onPad,
      }}
      status={{ ...status, onClear: () => (say('status.onClear'), setStatus((s) => ({ ...s, text: null }))) }}
    />
  );
}

export default StagePlayground;
