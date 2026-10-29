import { frameLoop } from './frames.bind';
import type { MixerCommands, MixerFrame } from './model';

export interface WaveControlsParams {
  deckId: string;
  ready: boolean;
  full: boolean;
  focus: string;
  sourceName: string;
  lanes: readonly string[];
  beats: number;
  moveTogether: boolean;
  readFrame(): MixerFrame;
  moveDeck?: MixerCommands['moveDeck'];
  setFocus?: MixerCommands['setFocus'];
}

/** One relative host transaction. Drawing and focus changes never write a frame snapshot. */
export function bindWaveControls(node: HTMLElement, initial: WaveControlsParams) {
  let params = initial;
  const window = node.ownerDocument.defaultView!;
  let drag: { x: number; width: number; beats: number; pointer: number; deckId: string; command: NonNullable<MixerCommands['moveDeck']> } | null = null;

  const end = (phase: 'commit' | 'cancel') => {
    const at = drag;
    if (!at) return;
    drag = null; // A release may synchronously dispatch lostpointercapture.
    (params.moveDeck ?? at.command)(at.deckId, phase);
    if (node.hasPointerCapture?.(at.pointer)) node.releasePointerCapture(at.pointer);
  };
  const cancel = () => end('cancel');
  const down = (event: PointerEvent) => {
    if (event.button !== 0 || !params.moveDeck || !params.ready) return;
    const width = node.getBoundingClientRect().width;
    if (!(width > 0)) return;
    event.preventDefault();
    cancel();
    node.focus();
    try { node.setPointerCapture?.(event.pointerId); } catch { /* Synthetic story pointers have no native capture. */ }
    drag = {
      x: event.clientX, width, beats: params.beats, pointer: event.pointerId,
      deckId: params.deckId, command: params.moveDeck,
    };
    params.moveDeck(params.deckId, 'begin');
  };
  const move = (event: PointerEvent) => {
    const at = drag;
    if (at && at.pointer === event.pointerId) (params.moveDeck ?? at.command)(at.deckId, 'move', (at.x - event.clientX) / at.width * at.beats);
  };
  const up = (event: PointerEvent) => { if (drag?.pointer === event.pointerId) end('commit'); };
  const pointerCancel = (event: PointerEvent) => { if (drag?.pointer === event.pointerId) cancel(); };
  const keydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') { event.preventDefault(); cancel(); return; }
    if (!params.ready) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      cancel();
      params.moveDeck?.(params.deckId, 'begin');
      params.moveDeck?.(params.deckId, 'move', (event.key === 'ArrowRight' ? 1 : -1) * (event.shiftKey ? 1 : 0.125));
      params.moveDeck?.(params.deckId, 'commit');
    }
    if ((event.key === 'ArrowUp' || event.key === 'ArrowDown') && !params.full) {
      event.preventDefault();
      const lanes = params.lanes;
      const i = lanes.indexOf(params.focus);
      const next = lanes[(Math.max(0, i) + (event.key === 'ArrowDown' ? 1 : lanes.length - 1)) % lanes.length];
      if (next) params.setFocus?.(params.deckId, next);
    }
  };
  const draw = () => {
    const reading = params.readFrame().decks[params.deckId];
    const seconds = reading?.seconds ?? 0;
    node.setAttribute('aria-valuemax', String(reading?.duration ?? 0));
    node.setAttribute('aria-valuenow', String(seconds));
    node.setAttribute('aria-valuetext', `${seconds.toFixed(3)} seconds · ${params.sourceName} · ${params.moveTogether ? 'Move active stems together' : 'Move focused stem'}`);
  };
  node.addEventListener('pointerdown', down);
  node.addEventListener('pointermove', move);
  node.addEventListener('pointerup', up);
  node.addEventListener('pointercancel', pointerCancel);
  node.addEventListener('lostpointercapture', pointerCancel);
  node.addEventListener('blur', cancel);
  node.addEventListener('keydown', keydown);
  window.addEventListener('blur', cancel);
  const stop = frameLoop(node, draw);
  // keyed() supplies a live Proxy, so remember identity separately before its next update.
  let deckId = params.deckId;
  return {
    update(next: WaveControlsParams) {
      if (next.deckId !== deckId || !next.ready || !next.moveDeck) cancel();
      params = next;
      deckId = next.deckId;
      draw();
    },
    destroy() {
      stop();
      cancel();
      node.removeEventListener('pointerdown', down);
      node.removeEventListener('pointermove', move);
      node.removeEventListener('pointerup', up);
      node.removeEventListener('pointercancel', pointerCancel);
      node.removeEventListener('lostpointercapture', pointerCancel);
      node.removeEventListener('blur', cancel);
      node.removeEventListener('keydown', keydown);
      window.removeEventListener('blur', cancel);
    },
  };
}
