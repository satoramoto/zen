// Mix View: Global Mix Mode (one mixer parameter across the eight tracks in view) and Track Mix
// Mode (one track's mixer, and its Input & Output) (openspec: push-mix-view).
import { indexOf } from '../layout';
import { clamp, selectedTrack } from '../state';
import { isDown, push, screen, type Ctx, type Layer } from '../engine';
import type { BodyCell, Parameter, PushSet, PushState, RowCell, Routing, Track } from '../types';
import { gather, paramCell, turnParameter } from './params';
import { rowInView, silent, type RowItem } from './tracks';

/** How many send tabs fit beside Volumes and Pans before the last becomes an arrow. */
const SENDS_PLAIN = 5;

/** Global Mix Mode's tabs: Volumes, Pans, then the sends in view, then an arrow when six or more returns exist. */
function globalTabs(state: PushState, set: PushSet): { label: string; parameter?: number; arrow?: boolean }[] {
  const returns = set.returns;
  const paged = returns.length >= 6;
  const page = paged ? clamp(state.mix.page, 0, Math.ceil(returns.length / SENDS_PLAIN) - 1) : 0;
  const shown = paged ? returns.slice(page * SENDS_PLAIN, page * SENDS_PLAIN + SENDS_PLAIN).map((r, i) => ({ r, n: page * SENDS_PLAIN + i })) : returns.map((r, n) => ({ r, n }));
  const tabs: { label: string; parameter?: number; arrow?: boolean }[] = [{ label: 'Volumes', parameter: 0 }, { label: 'Pans', parameter: 1 }, ...shown.map(({ r, n }) => ({ label: r.name, parameter: 2 + n }))];
  if (paged) {
    while (tabs.length < 7) tabs.push({ label: '' });
    tabs.push({ label: '', arrow: true });
  }
  return tabs.slice(0, 8);
}

/** The mixer parameter of a row item that Global Mix Mode's chosen tab shows. */
function mixParameter(item: RowItem, parameter: number): Parameter | undefined {
  const of = item.pad ?? item.chain ?? item.track;
  if (parameter === 0) return of.volume;
  if (parameter === 1) return of.pan;
  return item.pad || item.chain ? undefined : item.track.sends[parameter - 2];
}

/** Track Mix Mode's parameters: volume, pan, the Main track's extras, then the sends in view. */
function trackParameters(state: PushState, track: Track): (Parameter | null)[] {
  const fixed = [track.volume, track.pan, ...(track.extras ?? [])];
  const room = 8 - fixed.length;
  const paged = track.sends.length > room;
  const page = paged ? clamp(state.mix.page, 0, Math.ceil(track.sends.length / room) - 1) : 0;
  return [...fixed, ...track.sends.slice(page * room, page * room + room)];
}

type RouteKey = 'inputType' | 'inputChannel' | 'outputType' | 'outputChannel' | 'inputTap';
const MONITOR = ['in', 'auto', 'off'] as const;
const MONITOR_NAMES = ['In', 'Auto', 'Off'];

/** Input & Output's columns: what each encoder chooses among. */
function routeColumns(state: PushState, routing: Routing): { name: string; key: RouteKey; value: string; choices: string[] }[] {
  const side = state.mix.side ?? 'input';
  const cols: { name: string; key: RouteKey; value: string; choices: string[] }[] =
    side === 'input'
      ? [{ name: 'Input Type', key: 'inputType', value: routing.inputType, choices: routing.inputTypes }, { name: 'Input Channel', key: 'inputChannel', value: routing.inputChannel, choices: routing.inputChannels }]
      : [{ name: 'Output Type', key: 'outputType', value: routing.outputType, choices: routing.outputTypes }, { name: 'Output Channel', key: 'outputChannel', value: routing.outputChannel, choices: routing.outputChannels }];
  if (side === 'input' && routing.inputTaps?.length) cols.push({ name: 'Tap', key: 'inputTap', value: routing.inputTap ?? routing.inputTaps[0], choices: routing.inputTaps });
  return cols;
}

const choiceCell = (col: number, name: string, value: string, choices: string[], more: Partial<BodyCell> = {}): BodyCell => ({ type: 'param', col, name, value, fraction: 0, style: 'choice', choices, chosen: Math.max(0, choices.indexOf(value)), ...more } as BodyCell);

export const mixView: Layer = {
  name: 'mix-view',
  active: (state) => state.display === 'mix',
  step(ctx: Ctx) {
    const { input, state, set, target } = ctx;
    if (!target) return false;
    const mix = state.mix;
    const track = selectedTrack(set);
    const upper = indexOf(target.id, 'upper');
    const encoder = indexOf(target.id, 'encoder');

    if (mix.mode === 'global') {
      if (upper !== undefined) {
        const tab = globalTabs(state, set)[upper - 1];
        if (input.kind !== 'down' || !tab) return true;
        if (tab.arrow) mix.page = (mix.page + 1) % Math.ceil(set.returns.length / SENDS_PLAIN);
        else if (tab.parameter !== undefined) mix.parameter = tab.parameter;
        return true;
      }
      if (encoder !== undefined) {
        const item = rowInView(state, set)[encoder - 1];
        const p = item ? mixParameter(item, mix.parameter) : undefined;
        if (!p || !item) return true;
        const about = { track: item.track.id, ...(item.pad ? { pad: item.pad.note } : {}), ...(item.chain ? { chain: item.chain.id } : {}) };
        if (input.kind === 'turn') turnParameter(ctx, p, input.value ?? 0, about);
        else if (input.kind === 'touch') push(ctx, 'touch-parameter', { parameter: p.id, ...about });
        else if (input.kind === 'release') push(ctx, 'release-parameter', { parameter: p.id, ...about });
        return true;
      }
      return false;
    }

    // Track Mix Mode.
    if (upper !== undefined) {
      if (input.kind !== 'down') return true;
      if (upper === 1) mix.io = false;
      else if (upper === 2 && track.routing) mix.io = true;
      else if (!mix.io && upper >= 7) {
        const room = 8 - 2 - (track.extras?.length ?? 0);
        const pages = Math.ceil(track.sends.length / room);
        if (pages > 1) mix.page = clamp(mix.page + (upper === 7 ? -1 : 1), 0, pages - 1);
      }
      return true;
    }
    if (encoder !== undefined) {
      if (mix.io && track.routing) {
        if (input.kind !== 'turn') return true;
        const moved = gather(state.notes, input.value ?? 0);
        if (!moved) return true;
        const pick = <T,>(list: readonly T[], now: T) => list[clamp(list.indexOf(now) + moved, 0, list.length - 1)];
        if (encoder === 1) {
          const next = pick(MONITOR, track.routing.monitor);
          if (next !== track.routing.monitor) push(ctx, 'set-monitor', { track: track.id, monitor: next });
        } else if (encoder === 2) mix.side = moved > 0 ? 'output' : 'input';
        else {
          const col = routeColumns(state, track.routing)[encoder - 3];
          const next = col ? pick(col.choices, col.value) : undefined;
          if (col && next !== undefined && next !== col.value) push(ctx, 'set-routing', { track: track.id, [col.key]: next });
        }
        return true;
      }
      const p = trackParameters(state, track)[encoder - 1];
      if (!p) return true;
      if (input.kind === 'turn') turnParameter(ctx, p, input.value ?? 0, { track: track.id });
      else if (input.kind === 'touch') push(ctx, 'touch-parameter', { parameter: p.id, track: track.id });
      else if (input.kind === 'release') push(ctx, 'release-parameter', { parameter: p.id, track: track.id });
      return true;
    }
    void isDown;
    return false;
  },
  paint(paint) {
    const { state, set } = paint;
    const mix = state.mix;
    const touched = (col: number) => (state.touched.includes(`encoder-${col}`) ? { touched: true } : {});

    if (mix.mode === 'global') {
      const tabs = globalTabs(state, set);
      const top: (RowCell | null)[] = Array.from({ length: 8 }, (_, i) => {
        const tab = tabs[i];
        if (!tab || (!tab.arrow && !tab.label)) return null;
        return tab.arrow ? { label: '', icon: 'right' } : { label: tab.label, selected: tab.parameter === mix.parameter };
      });
      const body: BodyCell[] = [];
      rowInView(state, set).forEach((item, i) => {
        const p = item ? mixParameter(item, mix.parameter) : undefined;
        if (!item || !p) return;
        const colour = (item.pad?.colour ?? item.chain?.colour ?? item.track.colour) as number;
        const dim = silent(item.track, set) || !!item.pad?.muted || !!item.chain?.muted;
        if (mix.parameter === 0) body.push({ type: 'meter', col: i + 1, track: item.pad ? `${item.track.id}:${item.pad.note}` : item.chain ? item.chain.id : item.track.id, name: p.name, value: p.display, fraction: p.value, colour, ...(dim ? { dim: true } : {}), ...touched(i + 1) });
        else body.push(paramCell(p, i + 1, { colour, ...(dim ? { disabled: true } : {}), ...touched(i + 1) }));
      });
      paint.screen = screen('mix-global', { top, body, bottom: paint.screen.bottom, ...(tabs.some((t) => t.arrow) ? { paging: { top: { left: false, right: true } } } : {}) });
      return;
    }

    const track = selectedTrack(set);
    const colour = track.colour;
    const dim = silent(track, set);
    const room = 8 - 2 - (track.extras?.length ?? 0);
    const pages = Math.ceil(track.sends.length / room);
    const top: (RowCell | null)[] = [{ label: 'Mix', selected: !mix.io }, track.routing ? { label: 'Input & Output', selected: !!mix.io } : null, null, null, null, null, null, null];
    if (!mix.io && pages > 1) {
      top[6] = { label: '', icon: 'left', ...(mix.page > 0 ? {} : { dim: true }) };
      top[7] = { label: '', icon: 'right', ...(mix.page < pages - 1 ? {} : { dim: true }) };
    }
    let body: BodyCell[];
    if (mix.io && track.routing) {
      const r = track.routing;
      body = [
        choiceCell(1, 'Monitor', MONITOR_NAMES[MONITOR.indexOf(r.monitor)], MONITOR_NAMES, { colour, ...touched(1) }),
        choiceCell(2, 'Routing', (mix.side ?? 'input') === 'input' ? 'Input' : 'Output', ['Input', 'Output'], { colour, ...touched(2) }),
        ...routeColumns(state, r).map((c, i) => choiceCell(3 + i, c.name, c.value, c.choices, { colour, ...touched(3 + i) })),
      ];
    } else body = trackParameters(state, track).flatMap((p, i) => (p ? [paramCell(p, i + 1, { colour, ...(dim ? { disabled: true } : {}), ...touched(i + 1) })] : []));
    paint.screen = screen('mix-track', { top, body, bottom: paint.screen.bottom, ...(pages > 1 && !mix.io ? { paging: { top: { left: mix.page > 0, right: mix.page < pages - 1 } } } : {}) });
  },
};
