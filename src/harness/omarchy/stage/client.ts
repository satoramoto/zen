// A play's handle on a stage session. Every action goes to Quickshell as real
// Qt input; every read comes from what Qt has on screen.

export const ROUTE = '/__omarchy-stage';

/**
 * What to act on: a string is exact visible text, `#name` an objectName.
 * An object can also match a placeholder, part of a text, pick the nth match
 * in reading order, or look only within another target.
 */
export type Target = string | {
  name?: string;
  text?: string;
  textContains?: string;
  placeholder?: string;
  index?: number;
  within?: Target;
};

export type Shown = { name: string; text: string; x: number; y: number; width: number; height: number; enabled: boolean; checked: boolean | null; focused: boolean; value: unknown };
export type ShownText = { text: string; x: number; y: number; width: number; height: number; name: string };
/** A command the plugin ran. `stdout` and `stderr` are kept when the fixture passed it through to a real program. */
export type Call = { name: string; argv: string[]; stdin: string; answered: boolean; by: 'fixture' | 'stage' | null; code?: number; at: number; exec?: string[]; stdout?: string; stderr?: string };
export type LogEntry = { at: number; kind: string; [key: string]: unknown };

export function target(t: Target): object {
  if (typeof t === 'string') return t.startsWith('#') ? { name: t.slice(1) } : { text: t };
  const out: Record<string, unknown> = { ...t };
  if (t.within !== undefined) out.within = target(t.within);
  return out;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export class StageClient {
  constructor(readonly id: string, readonly route: string = ROUTE) {}

  private async post<T>(what: string, body: unknown): Promise<T> {
    const res = await fetch(`${this.route}/sessions/${this.id}/${what}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
    return data.result as T;
  }

  /** One request to the stage, as-is. */
  call<T = unknown>(op: string, args: object = {}): Promise<T> {
    return this.post<T>('call', { op, ...args });
  }

  /** Retries `action` while it fails (the target not shown yet, or disabled), up to `timeout` ms. */
  private async retry<T>(action: () => Promise<T>, timeout = 5000): Promise<T> {
    const deadline = Date.now() + timeout;
    let last: unknown;
    for (;;) {
      try { return await action(); } catch (e) {
        last = e;
        if (!/nothing shown matches|is disabled|only \d+ shown/.test(String((e as Error).message)) || Date.now() > deadline) throw e;
      }
      await sleep(80);
      if (Date.now() > deadline) throw last;
    }
  }

  /** Clicks a control at its centre: a real press and release. Waits for it to be shown and enabled. */
  click(t: Target, o: { timeout?: number; button?: 'left' | 'right' | 'middle'; at?: { x: number; y: number }; modifiers?: string[]; double?: boolean } = {}) {
    return this.retry(() => this.call<Shown>('click', { target: target(t), button: o.button, at: o.at, modifiers: o.modifiers, double: o.double }), o.timeout);
  }

  /** Clicks a field, selects what it holds (unless `append`) and types `text` key by key. */
  type(t: Target, text: string, o: { append?: boolean; timeout?: number } = {}) {
    return this.retry(() => this.call<Shown>('type', { target: target(t), text, append: !!o.append }), o.timeout);
  }

  /** Presses one key: a name (Escape, Enter, Tab, Backtab, Up, Down, …) or a character. */
  press(key: string, o: { modifiers?: string[] } = {}) {
    return this.call('key', { key, modifiers: o.modifiers });
  }

  /** Moves the pointer over a target. */
  hover(t: Target, o: { timeout?: number; at?: { x: number; y: number } } = {}) {
    return this.retry(() => this.call<Shown>('hover', { target: target(t), at: o.at }), o.timeout);
  }

  /** Everything shown that matches. Empty when nothing does. */
  find(t: Target) { return this.call<Shown[]>('find', { target: target(t) }); }

  /** One shown target's state, with any extra properties named. */
  inspect(t: Target, props: string[] = []) { return this.call<Shown & Record<string, unknown>>('inspect', { target: target(t), props }); }

  /** The item with keyboard focus. */
  focused() { return this.call<Shown | null>('focused'); }

  /** Every text Qt shows, in reading order. */
  texts() { return this.call<ShownText[]>('texts'); }

  /** Just the strings of `texts()`. */
  async strings() { return (await this.texts()).map((t) => t.text); }

  /** Waits for a shown text equal to (or matching) `match`. */
  async waitForText(match: string | RegExp, o: { timeout?: number } = {}): Promise<ShownText> {
    const deadline = Date.now() + (o.timeout ?? 5000);
    const test = (s: string) => (typeof match === 'string' ? s === match : match.test(s));
    for (;;) {
      const hit = (await this.texts()).find((t) => test(t.text));
      if (hit) return hit;
      if (Date.now() > deadline) throw new Error(`no text ${match} shown within ${o.timeout ?? 5000} ms; shown: ${JSON.stringify(await this.strings())}`);
      await sleep(80);
    }
  }

  /** Waits until no shown text equals (or matches) `match`. */
  async waitForNoText(match: string | RegExp, o: { timeout?: number } = {}): Promise<void> {
    const deadline = Date.now() + (o.timeout ?? 5000);
    const test = (s: string) => (typeof match === 'string' ? s === match : match.test(s));
    for (;;) {
      if (!(await this.texts()).some((t) => test(t.text))) return;
      if (Date.now() > deadline) throw new Error(`text ${match} still shown after ${o.timeout ?? 5000} ms`);
      await sleep(80);
    }
  }

  /** The session's log: commands, reports from fakes, and Qt's warnings. */
  async log(after = 0): Promise<{ log: LogEntry[]; calls: Call[] }> {
    const res = await fetch(`${this.route}/sessions/${this.id}/log?after=${after}`);
    return res.json();
  }

  /** Every command the plugin ran, optionally only one command's. */
  async calls(name?: string): Promise<Call[]> {
    const { calls } = await this.log(Number.MAX_SAFE_INTEGER);
    return name ? calls.filter((c) => c.name === name) : calls;
  }

  /** Waits for the plugin to run a command (whose argv passes `test`, if given). */
  async waitForCall(name: string, test?: (argv: string[]) => boolean, o: { timeout?: number } = {}): Promise<Call> {
    const deadline = Date.now() + (o.timeout ?? 5000);
    for (;;) {
      const hit = (await this.calls(name)).find((c) => !test || test(c.argv));
      if (hit) return hit;
      if (Date.now() > deadline) throw new Error(`${name} wasn't run within ${o.timeout ?? 5000} ms; ran: ${JSON.stringify((await this.calls()).map((c) => [c.name, ...c.argv].join(' ')))}`);
      await sleep(80);
    }
  }

  /** Reports fakes sent (service calls, Hyprland dispatches, tooltips). */
  async reports(kind?: string) {
    const { log } = await this.log(0);
    return log.filter((e) => e.kind === 'report').map((e) => e.report as { kind: string; data: any })
      .filter((r) => !kind || r.kind === kind);
  }

  /** Runs one of the fixture's operations (adds a persona, unplugs a device, …). */
  fixture<T = unknown>(op: string, data?: unknown) { return this.post<T>('fixture', { op, data }); }

  /** Calls the plugin's IPC handler, as a keybind's `quickshell ipc call` would. */
  ipc(target: string, fn: string, ...args: unknown[]) { return this.post<string>('ipc', { target, fn, args }); }

  /** Presses a GlobalShortcut the plugin declared. */
  shortcut(name: string, appid?: string) { return this.call('shortcut', { name, appid }); }

  /** Waits until frames stop changing for `quiet` ms. */
  async settle(o: { quiet?: number; timeout?: number } = {}) {
    const quiet = o.quiet ?? 200, deadline = Date.now() + (o.timeout ?? 5000);
    let n = (await this.call<{ n: number }>('frame')).n;
    for (;;) {
      await sleep(quiet);
      const next = (await this.call<{ n: number }>('frame')).n;
      if (next === n + 1 || Date.now() > deadline) return;
      n = next;
    }
  }

  /** Live input from the viewer: pointer and keys, in the stage's own coordinates. */
  pointer(kind: 'move' | 'press' | 'release' | 'wheel' | 'double', x: number, y: number, o: { button?: string; buttons?: boolean; dx?: number; dy?: number; modifiers?: string[] } = {}) {
    return this.post('input', { op: 'pointer', kind, x, y, ...o });
  }
  key(kind: 'press' | 'release' | 'click', key: string, modifiers?: string[]) {
    return this.post('input', { op: 'key', kind, key, modifiers });
  }

  close() { return fetch(`${this.route}/sessions/${this.id}`, { method: 'DELETE', keepalive: true }); }

  /** After the session closed: whether its Quickshell still runs and its folders remain. */
  async leftBehind(): Promise<{ running: boolean; folder: boolean; runtime: boolean }> {
    const res = await fetch(`${this.route}/closed/${this.id}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
    return data;
  }
}
