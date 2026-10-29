import { meterLevel } from '../music/Meter.model';
import type { MixerFrame } from './model';

/** Every loop is scoped to its bound node and cancelled before that node disappears. */
export function frameLoop(node: HTMLElement, draw: (now: number) => void, immediate = true) {
  const clock = node.ownerDocument.defaultView!;
  let frame = 0;
  let alive = true;
  const tick = (now: number) => {
    if (!alive) return;
    draw(now);
    if (alive) frame = clock.requestAnimationFrame(tick);
  };
  if (immediate) tick(clock.performance.now());
  else frame = clock.requestAnimationFrame(tick);
  return () => { alive = false; clock.cancelAnimationFrame(frame); };
}

export interface FrameMeterParams { sample(): number }
export function bindFrameMeter(node: HTMLElement, initial: FrameMeterParams) {
  let params = initial;
  let previous = node.ownerDocument.defaultView!.performance.now();
  let level = 0;
  const meter = node.querySelector<HTMLElement>('[role="meter"]');
  const stop = frameLoop(node, (now) => {
    const dt = Math.max(0, Math.min(100, now - previous));
    previous = now;
    const target = meterLevel(params.sample());
    level += (target - level) * (1 - Math.exp(-dt / (target > level ? 35 : 140)));
    if (target === 0 && level < 0.0001) level = 0;
    node.style.setProperty('--wdg-meter-fill', String(level));
    meter?.setAttribute('aria-valuenow', String(Math.round(level * 100)));
  }, false);
  return { update(next: FrameMeterParams) { params = next; }, destroy: stop };
}

export interface FrameReadParams { deckId: string; readFrame(): MixerFrame }
export function bindFramePlayhead(node: HTMLElement, initial: FrameReadParams) {
  let params = initial;
  const draw = () => {
    const beat = params.readFrame().decks[params.deckId]?.beat ?? 0;
    node.style.left = `${((beat % 128 + 128) % 128) / 128 * 100}%`;
  };
  const stop = frameLoop(node, draw);
  return { update(next: FrameReadParams) { params = next; draw(); }, destroy: stop };
}

export interface FrameWaveLaneParams extends FrameReadParams {
  laneId: string;
  fixed: boolean;
  start: number;
  visible: number;
  length: number;
}
export function bindFrameWaveLane(node: HTMLElement, initial: FrameWaveLaneParams) {
  let params = initial;
  const strip = node.querySelector<HTMLElement>('.play-wave-scroll');
  const head = node.querySelector<HTMLElement>('.play-playhead');
  const slip = node.querySelector<HTMLElement>('.play-slip-marker');
  const draw = () => {
    const { deckId, laneId, fixed, start, visible, length } = params;
    const at = params.readFrame().decks[deckId];
    const source = at?.sources?.[laneId];
    const beat = source?.beat ?? at?.beat ?? 0;
    const xOf = (position: number) => fixed ? (position - start) / visible * 100 : 25 + (position - beat) / visible * 100;
    if (strip) strip.style.transform = fixed ? 'none' : `translateX(${(0.25 - (beat - start) / visible) * visible / length * 100}%)`;
    if (head) head.style.left = `${xOf(beat)}%`;
    if (slip) {
      const background = source?.backgroundBeat;
      slip.hidden = background === undefined;
      if (background !== undefined) {
        slip.style.left = `${Math.max(0, Math.min(98, xOf(background)))}%`;
        slip.textContent = `SLIP ${background.toFixed(1)}`;
      }
    }
  };
  const stop = frameLoop(node, draw);
  return { update(next: FrameWaveLaneParams) { params = next; draw(); }, destroy: stop };
}

export function bindFramePosition(node: HTMLElement, initial: FrameReadParams) {
  let params = initial;
  const draw = () => {
    const at = params.readFrame().decks[params.deckId];
    if (!at) return;
    const seconds = Math.max(0, Math.floor(at.seconds ?? 0));
    node.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} · ${Math.max(1, Math.floor(at.beat / 4) + 1)}.${Math.floor((at.beat % 4 + 4) % 4) + 1}`;
  };
  const stop = frameLoop(node, draw);
  return { update(next: FrameReadParams) { params = next; draw(); }, destroy: stop };
}
