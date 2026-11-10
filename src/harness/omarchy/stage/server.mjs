// The stage's server: a Vite plugin that runs one Session per open story and
// serves it over plain HTTP under /__omarchy-stage/.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Session, STAGE_HOME, RUNTIME_PREFIX, removeOwned, unavailable } from './session.mjs';

export const ROUTE = '/__omarchy-stage';
const IDLE_MS = 90_000;

/**
 * @typedef {object} PluginEntry
 * @property {string | (() => string)} source the plugin's folder (its manifest.json is read from it)
 * @property {string[]} [roles] which entry points to load (default: every one in the manifest)
 * @property {string} [section] bar section for a bar widget: left, center or right
 * @property {object} [settings] the widget's inline settings
 * @property {(dir: string, session: Session) => void} [prepare] edits the staged copy (fills placeholders)
 * @property {string} [fixture] a module whose default export builds the session's fixture
 * @property {string} [missing] what to tell the viewer when the source isn't on this machine
 */

/**
 * @param {{ plugins: Record<string, PluginEntry>, root?: string }} options
 * @returns {import('vite').Plugin}
 */
export function omarchyStage(options) {
  const sessions = new Map();
  let reaper = null;

  function resolveSource(entry) {
    const source = typeof entry.source === 'function' ? entry.source() : entry.source;
    return path.resolve(options.root ?? process.cwd(), source);
  }

  function describe(id) {
    const entry = options.plugins[id];
    if (!entry) return { id, available: false, reason: `no plugin ${id} in the stage's registry` };
    const source = resolveSource(entry);
    const manifestFile = path.join(source, 'manifest.json');
    if (!fs.existsSync(manifestFile)) return { id, available: false, reason: entry.missing ?? `${id} isn't on this machine (no ${manifestFile})` };
    const manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
    return { id, available: true, source, manifest };
  }

  async function loadFixture(entry) {
    if (!entry.fixture) return null;
    const file = path.resolve(options.root ?? process.cwd(), entry.fixture);
    const mod = await import(`${pathToFileURL(file).href}?t=${fs.statSync(file).mtimeMs}`);
    return mod.default;
  }

  async function open(body) {
    const why = unavailable();
    if (why) throw Object.assign(new Error(why), { status: 503 });
    const info = describe(body.plugin);
    if (!info.available) throw Object.assign(new Error(info.reason), { status: 404 });
    const entry = options.plugins[body.plugin];
    const points = info.manifest.entryPoints ?? {};
    const roles = body.roles ?? entry.roles ?? Object.keys(points);
    const entries = roles.filter((r) => points[r]).map((role) => ({ role, file: points[role] }));
    if (!entries.length) throw Object.assign(new Error(`${body.plugin} has none of the entry points ${roles.join(', ')}`), { status: 400 });
    const session = new Session({
      id: body.plugin,
      source: info.source,
      manifest: info.manifest,
      entries,
      section: body.section ?? entry.section ?? info.manifest.barWidget?.defaultSection ?? 'left',
      settings: { ...(info.manifest.barWidget?.defaults ?? {}), ...(entry.settings ?? {}), ...(body.settings ?? {}) },
      prepare: entry.prepare,
      fixture: await loadFixture(entry),
      state: body.state,
      width: body.width, height: body.height, scale: body.scale,
      theme: body.theme, animations: body.animations,
    });
    sessions.set(session.key, session);
    try {
      await session.start();
    } catch (error) {
      sessions.delete(session.key);
      const log = session.log.slice(-40);
      await session.close();
      throw Object.assign(error, { status: 500, log });
    }
    return session;
  }

  async function close(key) {
    const s = sessions.get(key);
    if (!s) return;
    sessions.delete(key);
    await s.close();
  }

  function closeAllNow() {
    for (const s of sessions.values()) {
      try { if (s.proc?.exitCode === null) process.kill(-s.proc.pid, 'SIGKILL'); } catch { /* gone */ }
      try { removeOwned(s.runtime, RUNTIME_PREFIX); } catch { /* not made */ }
      try { removeOwned(s.dir, path.join(STAGE_HOME, 'sessions') + path.sep); } catch { /* not made */ }
    }
    sessions.clear();
  }

  // Sessions left by a server that was killed: nothing of theirs is running
  // (bwrap dies with its parent), so their folders go.
  function sweep() {
    const dir = path.join(STAGE_HOME, 'sessions');
    if (!fs.existsSync(dir)) return;
    for (const name of fs.readdirSync(dir)) {
      if (!/^[0-9a-f]{12}$/.test(name) || [...sessions.values()].some((s) => s.key === name)) continue;
      const cfg = path.join(dir, name, 'cfg', 'stage', 'config.js');
      let runtime = null;
      try { runtime = JSON.parse(fs.readFileSync(cfg, 'utf8').replace(/^[^{]*/, '').replace(/\s*$/, '')).socket.replace(/\/stage\.sock$/, ''); } catch { /* no config */ }
      const age = Date.now() - fs.statSync(path.join(dir, name)).mtimeMs;
      if (age < 10 * 60_000) continue;
      try { if (runtime) removeOwned(runtime, RUNTIME_PREFIX); } catch { /* gone */ }
      try { removeOwned(path.join(dir, name), dir + path.sep); } catch { /* gone */ }
    }
  }

  async function body(req) {
    let data = '';
    for await (const chunk of req) data += chunk;
    return data ? JSON.parse(data) : {};
  }

  function json(res, status, value) {
    res.statusCode = status;
    res.setHeader('content-type', 'application/json');
    res.setHeader('cache-control', 'no-store');
    res.end(JSON.stringify(value));
  }

  async function handle(req, res) {
    const url = new URL(req.url, 'http://stage');
    const parts = url.pathname.slice(ROUTE.length).split('/').filter(Boolean);
    try {
      if (parts[0] === 'status' && req.method === 'GET') {
        const why = unavailable();
        const plugins = Object.keys(options.plugins).map((id) => {
          const d = describe(id);
          return { id, available: d.available, reason: d.reason ?? null, name: d.manifest?.name ?? id };
        });
        return json(res, 200, { available: !why, reason: why, plugins, sessions: sessions.size });
      }
      if (parts[0] !== 'sessions') return json(res, 404, { error: 'no such route' });
      if (parts.length === 1 && req.method === 'POST') {
        const s = await open(await body(req));
        return json(res, 200, { id: s.key, width: s.options.width, height: s.options.height, scale: s.options.scale, errors: s.ready?.errors ?? [], log: s.log.slice(-40) });
      }
      const s = sessions.get(parts[1]);
      if (!s) return json(res, 410, { error: 'this story\'s session has ended; reload the story' });
      const what = parts[2];
      if (req.method === 'DELETE' || what === 'close') { await close(s.key); return json(res, 200, { closed: true }); }
      if (what === 'frame') {
        const after = Number(url.searchParams.get('after') ?? 0);
        let gone = false;
        res.on('close', () => { if (!res.writableEnded) gone = true; });
        const frame = await s.nextFrame(after, Number(url.searchParams.get('wait') ?? 25000));
        if (gone) return;
        s.lastSeen = Date.now();
        if (!frame) { res.statusCode = 204; return res.end(); }
        res.statusCode = 200;
        res.setHeader('content-type', 'image/png');
        res.setHeader('cache-control', 'no-store');
        res.setHeader('x-frame', String(frame.n));
        return res.end(frame.png);
      }
      if (what === 'input' || what === 'call') {
        const request = await body(req);
        const result = await s.call(request, request.timeout ?? 15000);
        return json(res, 200, { result });
      }
      if (what === 'fixture') {
        const { op, data } = await body(req);
        return json(res, 200, { result: (await s.fixtureOp(op, data)) ?? null });
      }
      if (what === 'ipc') {
        const { target, fn, args } = await body(req);
        return json(res, 200, { result: await s.ipc(target, fn, args ?? []) });
      }
      if (what === 'log') {
        const after = Number(url.searchParams.get('after') ?? 0);
        return json(res, 200, { log: s.log.filter((e) => e.at > after), calls: s.calls });
      }
      return json(res, 404, { error: 'no such route' });
    } catch (error) {
      return json(res, error.status ?? 400, { error: error.message, log: error.log ?? undefined });
    }
  }

  return {
    name: 'zen:omarchy-stage',
    configureServer(server) {
      sweep();
      server.middlewares.use((req, res, next) => (req.url?.startsWith(ROUTE + '/') ? handle(req, res) : next()));
      reaper = setInterval(() => {
        for (const s of sessions.values()) if (Date.now() - s.lastSeen > IDLE_MS) close(s.key);
      }, 10_000);
      reaper.unref();
      server.httpServer?.once('close', () => { clearInterval(reaper); closeAllNow(); });
      process.once('exit', closeAllNow);
      // Close on a signal too, and exit only if nothing else was listening
      // (a listener of ours would otherwise stop the default exit).
      for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
        const onSignal = () => {
          closeAllNow();
          if (process.listenerCount(signal) === 1) process.exit(128 + ({ SIGINT: 2, SIGTERM: 15, SIGHUP: 1 })[signal]);
        };
        process.once(signal, onSignal);
      }
    },
  };
}

export default omarchyStage;
