import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/core/Button/Button';
import type { Param } from '../components/core/Param/param';
import { Slider } from '../components/core/Slider/Slider';
import { Keys } from '../components/music/Keys/Keys';
import { Stack } from '../primitives/Stack';
import { Figure } from './Figure';
import { harmonicFacts } from './harmonic.sample';
import './HarmonicString.css';

const HARMONIC: Param = { kind: 'int', min: 1, max: 8, defaultValue: 3, steps: 8, name: 'Harmonic', shortName: 'n' };
/** The fundamental the figure plays: A at 110 Hz. */
const F1 = 110;

/* ---------- the drawing ---------- */

const W = 360;
const H = 120;
const X0 = 14;
const X1 = W - 14;
const MID = H / 2;
const AMP = 42;
const SAMPLES = 144;

/** The string's shape for mode `n` at displacement `a` (−1…1 of the envelope). */
function wavePath(n: number, a: number): string {
  let d = '';
  for (let i = 0; i <= SAMPLES; i++) {
    const u = i / SAMPLES;
    const x = X0 + u * (X1 - X0);
    const y = MID - a * AMP * Math.sin(n * Math.PI * u);
    d += `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`;
  }
  return d;
}

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const q = matchMedia('(prefers-reduced-motion: reduce)');
    const on = () => setReduced(q.matches);
    q.addEventListener('change', on);
    return () => q.removeEventListener('change', on);
  }, []);
  return reduced;
}

/** The standing wave of harmonic `n`: the envelope, the moving string, its nodes. */
function StandingWave({ n }: { n: number }) {
  const reduced = useReducedMotion();
  const [a, setA] = useState(1);
  useEffect(() => {
    if (reduced) {
      setA(1);
      return;
    }
    let frame = 0;
    const start = performance.now();
    // Mode n vibrates n times as fast as the fundamental; slowed so the eye can follow it.
    const tick = (now: number) => {
      setA(Math.cos(2 * Math.PI * 0.6 * n * ((now - start) / 1000)));
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [n, reduced]);
  const nodes = Array.from({ length: n + 1 }, (_, k) => X0 + (k / n) * (X1 - X0));
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="cmp-wave" role="img" aria-label={`String vibrating in mode ${n}: ${n} loops, ${n - 1} nodes between the ends`}>
      <line x1={X0} y1={MID} x2={X1} y2={MID} className="cmp-wave__rest" />
      <path d={wavePath(n, 1)} className="cmp-wave__envelope" />
      <path d={wavePath(n, -1)} className="cmp-wave__envelope" />
      <path d={wavePath(n, a)} className="cmp-wave__string" />
      {nodes.map((x, k) => (
        <circle key={k} cx={x} cy={MID} r={k === 0 || k === n ? 3.2 : 2.6} className={k === 0 || k === n ? 'cmp-wave__end' : 'cmp-wave__node'} />
      ))}
    </svg>
  );
}

/* ---------- the sound ---------- */

let audio: AudioContext | null = null;

/** Plays `freqs` together as sines, with a soft attack and a long decay. */
function play(freqs: number[]) {
  audio ??= new AudioContext();
  const ctx = audio;
  void ctx.resume();
  const t = ctx.currentTime;
  for (const f of freqs) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18 / freqs.length, t + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 1.9);
  }
}

/* ---------- the keyboard, at the width it's given ---------- */

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/**
 * Figure: the overtones of a vibrating string. A slider picks harmonic n; the string is drawn in
 * that mode, the nearest key is lit, and the buttons play the overtone alone or with the
 * harmonic below it (the interval their ratio makes).
 */
export function HarmonicString({ number = 'Figure 1' }: { number?: string }) {
  const [n, setN] = useState(HARMONIC.defaultValue);
  const [keysBox, keysWidth] = useWidth<HTMLDivElement>();
  const fact = harmonicFacts(n, F1);
  return (
    <Figure
      number={number}
      title="Overtones of a vibrating string"
      control={
        <Stack gap={3}>
          <Slider
            param={HARMONIC}
            value={n}
            onChange={(v) => setN(Math.round(v))}
            orientation="horizontal"
            layout="row"
            length="auto"
            name="Harmonic n"
            display={String(n)}
          />
          <Stack direction="row" gap={2} wrap>
            <Button label={`Play harmonic ${n}`} onPress={() => play([n * F1])} />
            <Button
              label={n > 1 ? `With harmonic ${n - 1}` : 'With the octave'}
              variant="secondary"
              onPress={() => play(n > 1 ? [(n - 1) * F1, n * F1] : [F1, 2 * F1])}
            />
          </Stack>
        </Stack>
      }
      changes={fact.changes}
      source="Ideal string fixed at both ends (modes sin(nπx/L), frequencies n·f₁); f₁ = 110 Hz. Naming after Sauveur (1701)."
    >
      <Stack gap={3}>
        <StandingWave n={n} />
        <div ref={keysBox} className="cmp-wave__keys">
          {keysWidth > 0 && (
            <Keys range={{ low: 45, high: 81 }} split={null} heldRight={[fact.midi]} rightName={`Harmonic ${n}`} rightHue={1} width={keysWidth} />
          )}
        </div>
      </Stack>
    </Figure>
  );
}
