// Browse Mode, Hot-Swap Mode, Packs and the Set Library: the lists a person moves through with the
// jog wheel and the D-pad by one rule (openspec: push-browser; push-encoders, "The jog wheel
// navigates by one rule"). Turning moves the highlight, pressing chooses, a nudge left goes back to
// the enclosing menu and a nudge right opens the item or its own menu.
import { indexOf } from '../layout';
import { clamp, selectedDevice, selectedTrack } from '../state';
import { isDown, lamp, OFF, pressed, push, screen, type Combo, type Ctx, type Layer } from '../engine';
import type { BodyCell, BrowserItem, DisplayMode, ListItem, Pack, PushSet, PushSetFile, PushState, RowCell } from '../types';
import { listChoose, listMove, nudged } from './dialogs';
import { instrumentKind } from './modes';
import { gather } from './params';

const X: RowCell = { label: '', icon: 'close' };

/* ---------- the tree ---------- */

/** The path in effect: in Hot-Swap Mode, until the person moves, the folder the selection came from. */
function pathOf(state: PushState, set: PushSet): string[] {
  const b = state.browse;
  return b.hotSwap && !b.navigated ? (set.browser.hotSwapPath ?? []) : b.path;
}

/** The lists along a path: the Add menu, then each opened folder's contents (undefined while the app has not listed them). */
function levels(set: PushSet, path: string[]): (BrowserItem[] | undefined)[] {
  const out: (BrowserItem[] | undefined)[] = [set.browser.roots];
  let items: BrowserItem[] | undefined = set.browser.roots;
  for (const id of path) {
    items = items?.find((i) => i.id === id)?.children;
    out.push(items);
  }
  return out;
}

/** The highlighted row of the last list: in Hot-Swap Mode, until the person moves, the selection's own item. */
function highlightOf(state: PushState, set: PushSet): number {
  const b = state.browse;
  const list = levels(set, pathOf(state, set)).at(-1) ?? [];
  if (b.hotSwap && !b.navigated) return Math.max(0, list.findIndex((i) => i.id === set.browser.hotSwapItem));
  return clamp(b.highlight, 0, Math.max(0, list.length - 1));
}
const current = (state: PushState, set: PushSet): BrowserItem | undefined => (levels(set, pathOf(state, set)).at(-1) ?? [])[highlightOf(state, set)];

/** Take the Hot-Swap folder as the person's own place, so a move starts from it. */
function settle(state: PushState, set: PushSet): void {
  const b = state.browse;
  if (!b.hotSwap || b.navigated) return;
  b.highlight = highlightOf(state, set);
  b.path = [...pathOf(state, set)];
  b.navigated = true;
}

const markOf = (i: BrowserItem) => (i.folder ? '›' : i.favourite ? '★' : i.tag);
const rows = (items: BrowserItem[]): ListItem[] => items.map((i) => ({ id: i.id, label: i.name, ...(markOf(i) ? { mark: markOf(i) } : {}) }));

/** Where in the tree a folder with this id is, as the ids to open, or undefined. */
function find(items: BrowserItem[], id: string, trail: string[] = []): string[] | undefined {
  for (const item of items) {
    if (item.id === id) return [...trail, item.id];
    const inside = item.children ? find(item.children, id, [...trail, item.id]) : undefined;
    if (inside) return inside;
  }
  return undefined;
}

/** Open the browser, remembering where to return to. */
function open(ctx: Ctx, hotSwap: boolean): void {
  const { state, set } = ctx;
  const b = state.browse;
  if (state.display !== 'browse') b.from = state.display;
  state.display = 'browse';
  delete b.packs;
  delete b.menu;
  if (!hotSwap) {
    // Browse Mode comes back to where it was left.
    if (b.hotSwap) {
      const kept = b.places.browse ?? { path: [], highlight: 0 };
      b.path = [...kept.path];
      b.highlight = kept.highlight;
    }
    delete b.hotSwap;
    delete b.navigated;
    return;
  }
  if (!b.hotSwap) b.places.browse = { path: [...b.path], highlight: b.highlight };
  b.hotSwap = true;
  delete b.navigated;
  // An empty audio slot has nothing to swap: the samples are where a clip for it comes from.
  const track = selectedTrack(set);
  if (track.kind === 'audio' && !track.clips[set.selection.scene] && !selectedDevice(set)) {
    const samples = find(set.browser.roots, 'samples');
    if (samples) {
      b.path = samples;
      b.highlight = 0;
      b.navigated = true;
    }
  }
}

function leave(state: PushState): void {
  const b = state.browse;
  if (!b.hotSwap) b.places.browse = { path: [...b.path], highlight: b.highlight };
  state.display = (b.from ?? 'device') as DisplayMode;
  delete b.packs;
  delete b.menu;
  if (b.hotSwap) {
    const kept = b.places.browse ?? { path: [], highlight: 0 };
    b.path = [...kept.path];
    b.highlight = kept.highlight;
    delete b.hotSwap;
    delete b.navigated;
  }
}

/** Choose an item: open a folder (asking the app to list it), or load what can be loaded. */
function choose(ctx: Ctx, item: BrowserItem): void {
  const { state, set } = ctx;
  const b = state.browse;
  const path = pathOf(state, set);
  if (item.folder) {
    settle(state, set);
    b.path = [...path, item.id];
    b.trail = [...b.path];
    b.highlight = 0;
    // The app lists a folder when it is opened; until then the column says it is loading.
    push(ctx, 'browse', { path: [...b.path] });
    return;
  }
  if (!item.loadable) return;
  const track = selectedTrack(set);
  const menu = path[0];
  if (menu === 'midi-track' || menu === 'audio-track' || menu === 'return-track') {
    // A new track of that kind: the default one, or one with the chosen sound or device on it.
    push(ctx, 'add-track', { type: menu.replace('-track', ''), ...(item.kind === 'track' ? {} : { load: item.id }) });
    leave(state);
    state.display = 'device';
    return;
  }
  if (b.hotSwap) {
    // Replace the selection and stay, so another can be tried.
    push(ctx, 'load', { item: item.id, content: item.kind, track: track.id, replace: set.selection.device ?? true });
    return;
  }
  push(ctx, 'load', { item: item.id, content: item.kind, track: track.id });
  leave(state);
  state.display = 'device';
}

/* ---------- Packs ---------- */

const GROUPS = ['Installed Packs', 'Available Packs'];
const packsOf = (set: PushSet, group: number): Pack[] => set.packs.filter((p) => (p.state === 'installed') === (group === 0));
const online = (set: PushSet) => set.unit.wifi.on && set.unit.wifi.networks.some((n) => n.connected);
const packMark = (p: Pack) => (p.state === 'installed' ? p.size : p.state === 'available' ? p.size : `${p.state === 'downloaded' ? 'Downloaded' : p.state === 'paused' ? 'Paused' : p.state === 'installing' ? 'Installing' : 'Downloading'}${p.progress === undefined ? '' : ` ${Math.round(p.progress * 100)} %`}`);

function packsStep(ctx: Ctx): boolean {
  const { state, set, input, target } = ctx;
  const p = state.browse.packs!;
  const list = p.group === undefined ? [] : packsOf(set, p.group);
  const move = listMove(ctx);
  if (move) {
    p.highlight = clamp(p.highlight + move, 0, Math.max(0, (p.group === undefined ? GROUPS.length : list.length) - 1));
    return true;
  }
  const nudge = nudged(ctx) || (isDown(ctx, 'dpad-left') ? -1 : isDown(ctx, 'dpad-right') ? 1 : 0);
  if (nudge < 0) {
    if (p.group === undefined) delete state.browse.packs;
    else state.browse.packs = { highlight: p.group };
    return true;
  }
  const pack = list[p.highlight];
  if (nudge > 0 && pack) {
    // A download that is paused or not yet installed can be deleted; an installed Pack uninstalled. Both ask first.
    if (pack.state === 'paused' || pack.state === 'downloaded') state.confirm = { text: `Delete the download of ${pack.name}?`, yes: { kind: 'file', action: 'delete-pack-download', pack: pack.id, label: 'Delete Download' } };
    else if (pack.state === 'installed') state.confirm = { text: `Uninstall ${pack.name}?`, yes: { kind: 'file', action: 'uninstall-pack', pack: pack.id, label: 'Uninstall' } };
    return true;
  }
  if (listChoose(ctx) || nudge > 0) {
    if (p.group === undefined) state.browse.packs = { group: p.highlight, highlight: 0 };
    else if (pack && (p.group === 0 || online(set))) {
      if (pack.state === 'available' || pack.state === 'paused') push(ctx, 'download-pack', { pack: pack.id });
      else if (pack.state === 'downloading') push(ctx, 'pause-pack', { pack: pack.id });
      else if (pack.state === 'downloaded') push(ctx, 'install-pack', { pack: pack.id });
    }
    return true;
  }
  const upper = target ? indexOf(target.id, 'upper') : undefined;
  if (upper !== undefined && input.kind === 'down') {
    if (upper === 1 || upper === 8) delete state.browse.packs;
    else if (upper === 7 && pack && (pack.state === 'installing' || pack.state === 'downloading')) push(ctx, 'cancel-pack', { pack: pack.id });
    return true;
  }
  return upper !== undefined;
}

function packsBody(state: PushState, set: PushSet): BodyCell[] {
  const p = state.browse.packs!;
  const groups: BodyCell = { type: 'list', col: 1, span: 2, label: 'Packs', items: GROUPS.map((label, i) => ({ id: String(i), label, mark: '›' })), chosen: String(p.group ?? p.highlight), ...(p.group === undefined ? {} : { enclosing: true }) };
  if (p.group === undefined) return [groups];
  if (p.group === 1 && !online(set)) return [groups, { type: 'text', col: 3, span: 6, text: 'A Wi-Fi connection is needed to see available Packs.', size: 'value', tone: 'dim' }];
  const list = packsOf(set, p.group);
  return [groups, { type: 'list', col: 3, span: 4, label: GROUPS[p.group], items: list.map((pack) => ({ id: pack.id, label: pack.name, mark: packMark(pack) })), chosen: list[p.highlight]?.id }];
}

/* ---------- Browse Mode and Hot-Swap Mode ---------- */

const ITEM_MENU = ['Delete', 'Rename'];

const combos: Combo[] = [
  {
    id: 'shift+save',
    hold: ['shift'],
    press: 'save',
    mode: 'Any',
    asks: 'Save the Set as a new version in its project',
    run: (ctx) => push(ctx, 'save-version'),
    example: { press: 'save' },
  },
  {
    id: 'duplicate+save',
    hold: ['duplicate'],
    press: 'save',
    mode: 'Any',
    asks: 'Save the Set as a new project',
    run: (ctx) => push(ctx, 'save-set-as'),
    example: { press: 'save' },
  },
  {
    id: 'session+new',
    hold: ['session'],
    press: 'new',
    mode: 'Any',
    asks: 'Make a new empty Set',
    run: (ctx) => push(ctx, 'new-set'),
    example: { press: 'new' },
  },
];

/** Add, Swap, Save and Sets: the buttons that open the lists, wherever the device is. */
export const library: Layer = {
  name: 'library',
  combos,
  step(ctx) {
    const { state } = ctx;
    if (isDown(ctx, 'add')) {
      if (state.display === 'browse' && !state.browse.hotSwap) leave(state);
      else open(ctx, false);
      return true;
    }
    if (isDown(ctx, 'swap')) {
      if (state.display === 'browse' && state.browse.hotSwap) leave(state);
      else if (swappable(state, ctx.set)) open(ctx, true);
      return true;
    }
    if (ctx.input.control === 'save') {
      if (pressed(ctx, 'save')) push(ctx, 'save-set');
      return true;
    }
    return false;
  },
  paint(paint) {
    const { state, set, lamps } = paint;
    lamps.add = lamp(state.display === 'browse' && !state.browse.hotSwap ? 'lit' : 'dim');
    lamps.swap = !swappable(state, set) ? OFF : lamp(state.display === 'browse' && state.browse.hotSwap ? 'lit' : 'dim');
    lamps.save = lamp('dim');
  },
};

/** Whether there is something to swap: a device, a drum pad's sound, a sample, or an empty audio slot to load a sample into. */
function swappable(_state: PushState, set: PushSet): boolean {
  const track = selectedTrack(set);
  return !!selectedDevice(set) || track.kind === 'audio';
}

export const browser: Layer = {
  name: 'browser',
  active: (state) => state.display === 'browse',
  step(ctx) {
    const { state, set, input, target } = ctx;
    if (!target) return false;
    const b = state.browse;
    if (b.packs) return packsStep(ctx);

    const item = current(state, set);
    const sideways = nudged(ctx) || (isDown(ctx, 'dpad-left') ? -1 : isDown(ctx, 'dpad-right') ? 1 : 0);

    // An item's own menu: Delete and Rename.
    if (b.menu !== undefined && item) {
      const move = listMove(ctx);
      if (move) return (b.menu = clamp(b.menu + move, 0, ITEM_MENU.length - 1)), true;
      if (sideways < 0) return delete b.menu, true;
      if (listChoose(ctx)) {
        if (ITEM_MENU[b.menu] === 'Rename') state.textEntry = { title: 'Rename', text: item.name, highlighted: 0, then: { kind: 'file', action: 'rename-file', item: item.id } };
        else state.confirm = { text: `Delete ${item.name}?`, yes: { kind: 'file', action: 'delete-file', item: item.id, label: 'Delete' } };
        delete b.menu;
        return true;
      }
    }

    const move = listMove(ctx);
    if (move) {
      settle(state, set);
      const list = levels(set, b.path).at(-1) ?? [];
      const next = clamp(b.highlight + move, 0, Math.max(0, list.length - 1));
      if (next !== b.highlight) {
        b.highlight = next;
        // With Preview on, each newly highlighted item that can be heard is.
        if (set.browser.preview && list[next]?.preview) push(ctx, 'preview', { item: list[next].id });
      }
      return true;
    }
    if (sideways < 0) {
      settle(state, set);
      const left = b.path.pop();
      if (left !== undefined) b.highlight = Math.max(0, (levels(set, b.path).at(-1) ?? []).findIndex((i) => i.id === left));
      return true;
    }
    if (sideways > 0 && item && !item.folder) {
      // Only the person's own content has a menu.
      if (item.editable) {
        settle(state, set);
        b.menu = 0;
      }
      return true;
    }
    if ((listChoose(ctx) || sideways > 0) && item) return choose(ctx, item), true;

    const encoder = indexOf(target.id, 'encoder');
    if (encoder === 1 && input.kind === 'turn') {
      // The first encoder steps back and forward through the menus already opened.
      const moved = Math.sign(input.value ?? 0) * Math.abs(Math.trunc(input.value ?? 0));
      settle(state, set);
      const trail = b.trail && b.trail.slice(0, b.path.length).join('/') === b.path.join('/') ? b.trail : [...b.path];
      const depth = clamp(b.path.length + moved, 0, trail.length);
      if (depth !== b.path.length) {
        const opened = b.path[depth] ?? trail[depth];
        b.path = trail.slice(0, depth);
        b.trail = trail;
        b.highlight = Math.max(0, (levels(set, b.path).at(-1) ?? []).findIndex((i) => i.id === opened));
      }
      return true;
    }
    if (encoder === 6 && input.kind === 'turn' && !b.hotSwap) {
      const moved = gather(state.notes, input.value ?? 0);
      if (moved) b.label = clamp((b.label ?? 0) + moved, 0, Math.max(0, (set.browser.labels?.length ?? 1) - 1));
      return true;
    }
    if (encoder !== undefined) return true;

    const upper = indexOf(target.id, 'upper');
    if (upper !== undefined) {
      if (input.kind !== 'down') return true;
      if (upper === 1) return leave(state), true;
      if (b.hotSwap) {
        if ((upper === 6 || upper === 7) && item) {
          // Load Previous and Load Next: the item before or after the current one in the list.
          settle(state, set);
          const list = levels(set, b.path).at(-1) ?? [];
          const next = list[b.highlight + (upper === 6 ? -1 : 1)];
          if (next?.loadable) {
            b.highlight += upper === 6 ? -1 : 1;
            choose(ctx, next);
          }
        }
        return true;
      }
      // The unit's buttons: Preview at the second, the label at the fourth, Packs at the seventh.
      if (upper === 2) push(ctx, 'preview', { on: !set.browser.preview });
      else if (upper === 4 && item && !item.folder) push(ctx, 'favourite', { item: item.id, label: set.browser.labels?.[b.label ?? 0] ?? 'Favorites', on: !item.favourite });
      else if (upper === 7) b.packs = { highlight: 0 };
      return true;
    }
    // A drum pad tapped while swapping one retargets the swap to it: the folder follows the new selection.
    if (b.hotSwap && target.kind === 'pad' && input.kind === 'down') delete b.navigated;
    return false;
  },
  paint(paint) {
    const { state, set, lamps } = paint;
    const b = state.browse;
    if (b.packs) {
      const group = b.packs.group;
      const pack = group === undefined ? undefined : packsOf(set, group)[b.packs.highlight];
      paint.screen = screen('packs', { top: [X, null, null, null, null, null, pack && (pack.state === 'installing' || pack.state === 'downloading') ? { label: 'Cancel' } : null, { label: 'Packs', selected: true }], body: packsBody(state, set), close: true });
      return;
    }
    const path = pathOf(state, set);
    const lists = levels(set, path);
    const highlight = highlightOf(state, set);
    // Up to four menus fit: the enclosing ones to the left, each with the item that is open marked.
    const from = Math.max(0, lists.length - 4);
    const body: BodyCell[] = lists.slice(from).map((items, i): BodyCell => {
      const level = from + i;
      const last = level === lists.length - 1;
      const title = level === 0 ? 'Add' : (lists[level - 1]?.find((x) => x.id === path[level - 1])?.name ?? '');
      if (!items) return { type: 'list', col: i * 2 + 1, span: 2, label: title, items: [], loading: true };
      return { type: 'list', col: i * 2 + 1, span: 2, label: title, items: rows(items), chosen: last ? items[highlight]?.id : path[level], ...(last && b.menu === undefined ? {} : { enclosing: true }) };
    });
    const item = current(state, set);
    if (b.menu !== undefined && item && body.length < 4) body.push({ type: 'list', col: body.length * 2 + 1, span: 2, label: item.name, items: ITEM_MENU.map((label) => ({ id: label, label })), chosen: ITEM_MENU[b.menu] });
    const device = selectedDevice(set);
    const label = set.browser.labels?.[b.label ?? 0] ?? 'Favorites';
    const top: (RowCell | null)[] = b.hotSwap
      ? [{ label: device?.name ?? selectedTrack(set).name, colour: selectedTrack(set).colour, selected: true }, null, null, null, null, { label: 'Load Previous' }, { label: 'Load Next' }, null]
      : [X, { label: 'Preview', icon: set.browser.preview ? 'switch-on' : 'switch-off', ...(set.browser.preview ? {} : { dim: true }) }, null, { label, icon: item?.favourite ? 'switch-on' : 'switch-off', ...(item && !item.folder && item.favourite ? {} : { dim: true }) }, null, null, { label: 'Packs' }, null];
    paint.screen = screen('browse', { top, body, close: !b.hotSwap });
    lamps['dpad-up'] = lamp(highlight > 0 ? 'dim' : 'off');
    lamps['dpad-down'] = lamp(highlight < (lists.at(-1)?.length ?? 0) - 1 ? 'dim' : 'off');
    lamps['dpad-left'] = lamp(path.length > 0 ? 'dim' : 'off');
    lamps['dpad-right'] = lamp(item?.folder || item?.editable ? 'dim' : 'off');
    lamps['dpad-centre'] = lamp(item ? 'dim' : 'off');
    // Swapping one drum pad: that pad blinks on the grid.
    const { kind, device: rack } = instrumentKind(selectedTrack(set));
    if (b.hotSwap && kind === 'drums' && rack?.selectedPad !== undefined) {
      for (const [id, note] of Object.entries(paint.notes)) if (note === rack.selectedPad && lamps[id].state !== 'off') lamps[id] = { ...lamps[id], state: 'blink' };
    }
  },
};

/* ---------- the Set Library ---------- */

/** The Sets in the order shown: by date or by name, most recently changed first by default. */
export function sortedSets(state: PushState, set: PushSet): PushSetFile[] {
  const { sort, ascending, cloud } = state.sets;
  const list = set.sets.filter((s) => !!s.cloud === !!cloud);
  const by = sort === 'name' ? (a: PushSetFile, b: PushSetFile) => a.name.localeCompare(b.name) : (a: PushSetFile, b: PushSetFile) => a.modified.localeCompare(b.modified);
  const sorted = [...list].sort(by);
  // By name the first is A; by date the first is the newest. The button under the encoder turns either round.
  const forward = sort === 'name' ? !ascending : !!ascending;
  return sort === 'name' ? (ascending === false ? sorted.reverse() : sorted) : forward ? sorted : sorted.reverse();
}

export const setLibrary: Layer = {
  name: 'set-library',
  active: (state) => state.display === 'sets',
  step(ctx) {
    const { state, set, input, target } = ctx;
    if (!target) return false;
    const s = state.sets;
    const list = sortedSets(state, set);
    const file = list[clamp(s.highlight, 0, Math.max(0, list.length - 1))];
    const sideways = nudged(ctx) || (isDown(ctx, 'dpad-left') ? -1 : isDown(ctx, 'dpad-right') ? 1 : 0);
    const cloud = set.sets.some((x) => x.cloud);

    if (s.menu !== undefined && file) {
      const move = listMove(ctx);
      if (move) return (s.menu = clamp(s.menu + move, 0, ITEM_MENU.length - 1)), true;
      if (sideways < 0) return delete s.menu, true;
      if (listChoose(ctx)) {
        if (ITEM_MENU[s.menu] === 'Rename') state.textEntry = { title: 'Rename Set', text: file.name, highlighted: 0, then: { kind: 'file', action: 'rename-file', set: file.id } };
        else state.confirm = { text: `Delete “${file.name}”?`, yes: { kind: 'file', action: 'delete-file', set: file.id, label: 'Delete' } };
        delete s.menu;
        return true;
      }
    }
    const move = listMove(ctx);
    if (move) return (s.highlight = clamp(s.highlight + move, 0, Math.max(0, list.length - 1))), true;
    if (sideways > 0 && file) return (s.menu = 0), true;
    if (sideways < 0) return true;
    if (listChoose(ctx) && file) return push(ctx, 'open-set', { set: file.id }), true;

    const encoder = indexOf(target.id, 'encoder');
    if (encoder !== undefined) {
      if (input.kind !== 'turn') return true;
      const moved = gather(state.notes, input.value ?? 0);
      if (encoder === 1 && moved && cloud) {
        s.cloud = moved > 0;
        s.highlight = 0;
      } else if (encoder === 3 && moved) {
        s.sort = moved > 0 ? 'name' : 'date';
        delete s.ascending;
        s.highlight = 0;
      }
      return true;
    }
    const upper = indexOf(target.id, 'upper');
    const lower = indexOf(target.id, 'lower');
    if (input.kind === 'down' && upper === 8) return push(ctx, 'new-set'), true;
    if (input.kind === 'down' && upper === 1) return (state.display = (state.momentary?.display ?? 'device') as DisplayMode), true;
    if (input.kind === 'down' && lower === 3) return (s.ascending = !(s.ascending ?? s.sort === 'name')), true;
    return upper !== undefined || lower !== undefined;
  },
  paint(paint) {
    const { state, set, lamps } = paint;
    const s = state.sets;
    const list = sortedSets(state, set);
    const highlight = clamp(s.highlight, 0, Math.max(0, list.length - 1));
    const cloud = set.sets.some((x) => x.cloud);
    const ascending = s.ascending ?? s.sort === 'name';
    const sets: BodyCell = { type: 'list', col: 4, span: s.menu === undefined ? 5 : 3, label: s.cloud ? 'Cloud' : 'Sets', items: list.map((f) => ({ id: f.id, label: f.name, mark: f.current ? 'Open' : f.modified })), chosen: list[highlight]?.id, ...(s.menu === undefined ? {} : { enclosing: true }) };
    paint.screen = screen('sets', {
      top: [X, null, null, null, null, null, null, { label: '+ New Set', icon: 'plus' }],
      bottom: [null, null, { label: ascending ? 'Ascending' : 'Descending' }, null, null, null, null, null],
      body: [
        ...(cloud ? [{ type: 'param' as const, col: 1, name: 'Library', value: s.cloud ? 'Cloud' : 'Sets', fraction: 0, style: 'choice' as const, choices: ['Sets', 'Cloud'], chosen: s.cloud ? 1 : 0 }] : []),
        { type: 'param', col: 3, name: 'Sort', value: s.sort === 'name' ? 'Name' : 'Date', fraction: 0, style: 'choice', choices: ['Date', 'Name'], chosen: s.sort === 'name' ? 1 : 0 },
        sets,
        ...(s.menu === undefined ? [] : [{ type: 'list' as const, col: 7, span: 2, label: list[highlight]?.name ?? '', items: ITEM_MENU.map((label) => ({ id: label, label })), chosen: ITEM_MENU[s.menu] }]),
      ],
      close: true,
    });
    lamps['dpad-up'] = lamp(highlight > 0 ? 'dim' : 'off');
    lamps['dpad-down'] = lamp(highlight < list.length - 1 ? 'dim' : 'off');
    lamps['dpad-left'] = lamp(s.menu !== undefined ? 'dim' : 'off');
    lamps['dpad-right'] = lamp(list.length && s.menu === undefined ? 'dim' : 'off');
    lamps['dpad-centre'] = lamp(list.length ? 'dim' : 'off');
  },
};
