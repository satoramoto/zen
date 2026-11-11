import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, KeyboardEvent, PointerEvent, WheelEvent } from 'react';
import { ROUTE, StageClient } from './client';
import type { Call, LogEntry } from './client';

export type OmarchyStageProps = {
  /** The plugin's id in the stage's registry. */
  plugin: string;
  /** What the story gives the plugin's fixture: personas, devices, battery, … */
  state?: unknown;
  /** Entry points to load (barWidget, service, menu, panel); the manifest's by default. */
  roles?: string[];
  /** The stage's screen, in Qt's logical pixels. */
  width?: number;
  height?: number;
  /** Device pixels per logical pixel. */
  scale?: number;
  /** An Omarchy theme by name, or the current one. */
  theme?: string;
  /** Run Omarchy's animations (off by default, so frames settle at once). */
  animations?: boolean;
  /** The widget's inline settings. */
  settings?: Record<string, unknown>;
  /** The bar section a widget sits in. */
  section?: 'left' | 'center' | 'right';
  /** Show the commands the plugin ran beside the screen. */
  log?: boolean;
  /** Where the stage server is; its own route by default. */
  server?: string;
};

const handles = new WeakMap<Element, Promise<StageClient>>();

/**
 * The stage client for the story in `canvasElement`, once its plugin has
 * loaded. A play awaits this before acting.
 */
export async function stageOf(canvasElement: Element, o: { timeout?: number } = {}): Promise<StageClient> {
  const deadline = Date.now() + (o.timeout ?? 30000);
  for (;;) {
    const el = canvasElement.querySelector('[data-omarchy-stage]');
    const handle = el && handles.get(el);
    if (handle) return handle;
    if (Date.now() > deadline) throw new Error('no Omarchy stage in this story');
    await new Promise((r) => setTimeout(r, 30));
  }
}

const NAMED: Record<string, string> = {
  Enter: 'Enter', Escape: 'Escape', Tab: 'Tab', Backspace: 'Backspace', Delete: 'Delete', Home: 'Home', End: 'End',
  PageUp: 'PageUp', PageDown: 'PageDown', ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right', ' ': 'Space',
};

function stageKey(e: KeyboardEvent): string | null {
  if (e.key === 'Tab' && e.shiftKey) return 'Backtab';
  if (NAMED[e.key]) return NAMED[e.key];
  if (/^F\d{1,2}$/.test(e.key)) return e.key;
  if (e.key.length === 1) return e.key;
  return null;
}

function mods(e: { ctrlKey: boolean; altKey: boolean; metaKey: boolean; shiftKey: boolean }, withShift: boolean) {
  return [e.ctrlKey && 'ctrl', e.altKey && 'alt', e.metaKey && 'meta', withShift && e.shiftKey && 'shift'].filter(Boolean) as string[];
}

const BUTTONS = ['left', 'middle', 'right'];

/**
 * An Omarchy plugin running in real Quickshell with Omarchy's kit, drawn as
 * Qt draws it. Point, click, scroll and type on it as on the bar.
 */
export function OmarchyStage({ plugin, state, roles, width = 1100, height = 760, scale = 1, theme = 'current', animations = false, settings, section, log = true, server = ROUTE }: OmarchyStageProps) {
  const ref = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const client = useRef<StageClient | null>(null);
  const [frame, setFrame] = useState<{ src: string; n: number } | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const key = JSON.stringify({ plugin, state, roles, width, height, scale, theme, animations, settings, section, server });

  useEffect(() => {
    const el = ref.current!;
    let cancelled = false;
    let id: string | null = null;
    setFailure(null);
    setFrame(null);
    setEntries([]);
    setCalls([]);
    const ready = (async () => {
      let res: Response;
      try {
        res = await fetch(`${server}/sessions`, {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ plugin, state, roles, width, height, scale, theme, animations, settings, section }),
        });
      } catch {
        throw new Error('These stories need the Storybook dev server: the Omarchy stage runs Quickshell on it.');
      }
      const type = res.headers.get('content-type') ?? '';
      if (!type.includes('application/json')) throw new Error('These stories need the Storybook dev server: the Omarchy stage runs Quickshell on it.');
      const data = await res.json();
      if (!res.ok) {
        const qt = (data.log ?? []).filter((e: LogEntry) => e.kind === 'qt' || e.kind === 'error')
          .map((e: LogEntry) => (e.line as string) ?? JSON.stringify(e.errors)).join('\n');
        throw new Error(`${data.error}${qt ? `\n\n${qt}` : ''}`);
      }
      id = data.id;
      if (data.errors?.length) throw new Error(`The plugin didn't load:\n${data.errors.join('\n')}`);
      if (cancelled) { void fetch(`${server}/sessions/${id}`, { method: 'DELETE', keepalive: true }); throw new Error('closed'); }
      return new StageClient(data.id, server);
    })();
    handles.set(el, ready);
    ready.catch(() => {});
    // Leaving the page runs no React cleanup: say goodbye on the way out.
    const onHide = () => { if (id) navigator.sendBeacon(`${server}/sessions/${id}/close`); };
    window.addEventListener('pagehide', onHide);

    ready.then(async (c) => {
      client.current = c;
      let n = 0;
      let last: string | null = null;
      while (!cancelled) {
        let res: Response;
        try { res = await fetch(`${server}/sessions/${c.id}/frame?after=${n}`); } catch { break; }
        if (res.status === 410) {
          const why = await res.json().then((d) => d.error as string, () => '');
          if (!cancelled) setFailure(why && why.startsWith('Quickshell crashed') ? why : 'This story\'s session has ended. Reload the story.');
          break;
        }
        if (res.status !== 200) continue;
        n = Number(res.headers.get('x-frame'));
        const src = URL.createObjectURL(await res.blob());
        if (cancelled) { URL.revokeObjectURL(src); break; }
        setFrame({ src, n });
        if (last) URL.revokeObjectURL(last);
        last = src;
      }
    }, (e: Error) => { if (!cancelled && e.message !== 'closed') setFailure(e.message); });

    let logTimer: ReturnType<typeof setInterval> | null = null;
    if (log) {
      let after = 0;
      logTimer = setInterval(async () => {
        const c = client.current;
        if (!c || cancelled) return;
        try {
          const data = await c.log(after);
          if (data.log.length) after = data.log[data.log.length - 1].at;
          setEntries((old) => [...old, ...data.log.filter((e) => e.kind === 'qt' || e.kind === 'report' || e.kind === 'error')].slice(-200));
          setCalls(data.calls.slice(-200));
        } catch { /* ended */ }
      }, 700);
    }

    return () => {
      cancelled = true;
      window.removeEventListener('pagehide', onHide);
      if (logTimer) clearInterval(logTimer);
      handles.delete(el);
      client.current = null;
      if (id) void fetch(`${server}/sessions/${id}`, { method: 'DELETE', keepalive: true });
    };
  }, [key]);

  // Pointer moves are coalesced: one in flight, the newest waiting.
  const moving = useRef<{ busy: boolean; next: [number, number, boolean] | null }>({ busy: false, next: null });
  const toStage = (e: { clientX: number; clientY: number }) => {
    const r = img.current!.getBoundingClientRect();
    return [Math.round(((e.clientX - r.left) / r.width) * width), Math.round(((e.clientY - r.top) / r.height) * height)] as const;
  };
  const move = (x: number, y: number, held: boolean) => {
    const m = moving.current;
    if (m.busy) { m.next = [x, y, held]; return; }
    m.busy = true;
    void client.current?.pointer('move', x, y, { buttons: held }).finally(() => {
      m.busy = false;
      const next = m.next;
      m.next = null;
      if (next) move(...next);
    });
  };
  const onPointer = (kind: 'press' | 'release') => (e: PointerEvent) => {
    if (!client.current) return;
    e.preventDefault();
    ref.current?.focus();
    const [x, y] = toStage(e);
    if (kind === 'press') (e.target as Element).setPointerCapture?.(e.pointerId);
    void client.current.pointer(kind, x, y, { button: BUTTONS[e.button] ?? 'left', modifiers: mods(e, true) });
  };
  const onMove = (e: PointerEvent) => { if (client.current) { const [x, y] = toStage(e); move(x, y, e.buttons !== 0); } };
  const onWheel = (e: WheelEvent) => {
    if (!client.current) return;
    const [x, y] = toStage(e);
    void client.current.pointer('wheel', x, y, { dy: -Math.sign(e.deltaY) * 120, dx: -Math.sign(e.deltaX) * 120 });
  };
  const onKey = (e: KeyboardEvent) => {
    if (!client.current) return;
    const k = stageKey(e);
    if (!k) return;
    e.preventDefault();
    void client.current.key('click', k, mods(e, k.length > 1));
  };

  const plain = calls.filter((c) => c.by !== 'stage');
  const staged = calls.length - plain.length;
  const box: CSSProperties = { width, height, position: 'relative', outline: 'none', background: '#0b0c10', flex: '0 0 auto' };
  return (
    <div style={{ display: 'inline-flex', gap: 16, alignItems: 'flex-start', font: '12px/1.5 ui-monospace, monospace', color: '#c0c4cc', background: '#15161c', padding: 12, borderRadius: 6 }}>
      <div ref={ref} data-omarchy-stage={plugin} data-frame={frame?.n ?? 0} tabIndex={0} style={box}
        onKeyDown={onKey} onWheel={onWheel} onContextMenu={(e) => e.preventDefault()}>
        {frame && (
          <img ref={img} src={frame.src} alt={`${plugin}, drawn by Qt`} draggable={false} width={width} height={height}
            style={{ display: 'block', width, height, imageRendering: scale === 1 ? 'pixelated' : 'auto', userSelect: 'none' }}
            onPointerDown={onPointer('press')} onPointerUp={onPointer('release')} onPointerMove={onMove} />
        )}
        {!frame && !failure && <p style={{ position: 'absolute', inset: 0, margin: 0, padding: 24 }}>Starting {plugin} in Quickshell…</p>}
        {failure && (
          <pre role="alert" style={{ position: 'absolute', inset: 0, margin: 0, padding: 24, whiteSpace: 'pre-wrap', color: '#f7768e', overflow: 'auto' }}>
            {failure}
          </pre>
        )}
      </div>
      {log && (
        <aside aria-label="What the plugin ran" style={{ width: 360, maxHeight: height, overflow: 'auto', flex: '0 0 auto' }}>
          <strong>Commands</strong>
          {plain.length === 0 && <p style={{ opacity: 0.6, margin: '4px 0' }}>None yet.</p>}
          <ol style={{ margin: '4px 0 12px', paddingLeft: 22 }}>
            {plain.map((c, i) => (
              <li key={i} style={{ color: c.answered ? undefined : '#e0af68', wordBreak: 'break-all' }}>
                {[c.name, ...c.argv].join(' ')}{c.answered ? '' : ' (no fake)'}{c.code ? ` → ${c.code}` : ''}
              </li>
            ))}
          </ol>
          {staged > 0 && <p style={{ opacity: 0.6, margin: '0 0 12px' }}>And {staged} the stage answered itself (Omarchy's own hyprctl and notify-send).</p>}
          {entries.length > 0 && <strong>Qt and fakes</strong>}
          <ol style={{ margin: '4px 0', paddingLeft: 22 }}>
            {entries.map((e, i) => (
              <li key={i} style={{ wordBreak: 'break-all', color: e.kind === 'qt' && /WARN|ERROR/.test(String(e.line)) ? '#e0af68' : undefined }}>
                {e.kind === 'qt' ? String(e.line) : e.kind === 'report' ? `${(e.report as { kind: string }).kind}: ${JSON.stringify((e.report as { data: unknown }).data)}` : JSON.stringify(e.errors)}
              </li>
            ))}
          </ol>
        </aside>
      )}
    </div>
  );
}
