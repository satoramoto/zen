// The browser pass: each story opened in its own page of Playwright's Chromium headless shell,
// against a served or built Storybook, and judged by what Storybook's own channel reports.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';

export const INSTALL = 'npx playwright install --only-shell chromium';

// Runs in the page before Storybook: records the events that say how a story ended.
function observe() {
  const run = (window.__STORY_RUN__ = { events: [] });
  const types = ['storyFinished', 'storyRendered', 'storyThrewException', 'storyErrored', 'playFunctionThrewException', 'unhandledErrorsWhilePlaying', 'storyMissing', 'storyHotUpdated'];
  const attached = new WeakSet();
  const attach = (channel) => {
    if (!channel?.on || attached.has(channel)) return;
    attached.add(channel);
    for (const type of types) channel.on(type, (...args) => {
      const clean = (v) => {
        if (v instanceof Error) return { message: v.message, stack: v.stack };
        if (Array.isArray(v)) return v.map(clean);
        if (v && typeof v === 'object') {
          const out = {};
          for (const [k, x] of Object.entries(v)) if (k !== 'reporters') out[k] = typeof x === 'object' ? clean(x) : x;
          return out;
        }
        return v;
      };
      run.events.push({ type, args: clean(args) });
    });
  };
  let channel = window.__STORYBOOK_ADDONS_CHANNEL__;
  attach(channel);
  Object.defineProperty(window, '__STORYBOOK_ADDONS_CHANNEL__', { configurable: true, get: () => channel, set: (next) => { channel = next; attach(next); } });
}

const FAILING = new Set(['storyThrewException', 'storyErrored', 'playFunctionThrewException', 'unhandledErrorsWhilePlaying', 'storyMissing']);

async function play(context, base, story, timeout) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(observe);
  const started = Date.now();
  try {
    await page.goto(`${base}/iframe.html?id=${story.id}&viewMode=story`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction((id) => {
      const ev = window.__STORY_RUN__?.events ?? [];
      return ev.some((e) => e.type === 'storyFinished' && e.args[0]?.storyId === id)
        || ev.some((e) => ['storyThrewException', 'storyErrored', 'playFunctionThrewException', 'storyMissing'].includes(e.type));
    }, story.id, { timeout, polling: 100 });
    const events = await page.evaluate(() => window.__STORY_RUN__.events);
    const problems = [];
    for (const e of events) {
      if (FAILING.has(e.type)) problems.push(`${e.type}: ${JSON.stringify(e.args).slice(0, 1500)}`);
      if (e.type === 'storyFinished' && e.args[0]?.status !== 'success') problems.push(`storyFinished ${e.args[0]?.status}`);
    }
    problems.push(...errors.map((m) => `page error: ${m}`));
    return { story, ok: problems.length === 0, problems, reloaded: events.some((e) => e.type === 'storyHotUpdated'), ms: Date.now() - started };
  } catch (e) {
    return { story, ok: false, problems: [`no result within ${timeout} ms: ${e.message.split('\n')[0]}`, ...errors], reloaded: true, ms: Date.now() - started };
  } finally {
    // Leaving the story unmounts it, which ends whatever it started.
    await page.goto('about:blank').catch(() => {});
    await page.close().catch(() => {});
  }
}

// A story a dev server reloaded mid-play (a file changed while it ran) is played again, up to
// twice: the reload, not the story, cut it short.
const cutShort = (r) => r.reloaded || r.problems.some((p) => /storyHotUpdated|the session has ended|"closed"/.test(p));

/**
 * Plays `stories` in the headless shell against the Storybook at `base`, `workers` at a time.
 * Resolves to null, or to why nothing was played ({ why, fix }) when the shell is not installed.
 */
export async function playInBrowser({ base, stories, workers, timeout, gpu = false, viewport = { width: 1600, height: 1000 }, report }) {
  if (!stories.length) return null;
  let chromium;
  // `playwright`, or `@playwright/test`, which a project with Playwright's test runner has instead.
  for (const name of ['playwright', '@playwright/test']) {
    try { ({ chromium } = await import(name)); break; } catch (e) { if (e?.code !== 'ERR_MODULE_NOT_FOUND') throw e; }
  }
  if (!chromium) return { why: 'Playwright is not installed in this project', fix: `npm install --save-dev playwright && ${INSTALL}` };
  // No executable path and no channel: Playwright launches the headless shell of the revision
  // this project's Playwright pins.
  let browser;
  // `gpu`: this machine's GPU for WebGL, where software WebGL is too slow for the plays.
  try { browser = await chromium.launch({ headless: true, ...(gpu ? { args: ['--ignore-gpu-blocklist', '--enable-gpu'] } : {}) }); } catch (e) {
    if (!/Executable doesn't exist/.test(e.message)) throw e;
    return { why: 'Playwright\'s Chromium headless shell is not installed', fix: INSTALL };
  }
  const queue = [...stories];
  try {
    await Promise.all(Array.from({ length: Math.max(1, workers) }, async () => {
      const context = await browser.newContext({ viewport });
      for (let s = queue.shift(); s; s = queue.shift()) {
        let r = await play(context, base, s, timeout);
        for (let again = 0; !r.ok && cutShort(r) && again < 2; again++) r = await play(context, base, s, timeout);
        report({ story: r.story, ok: r.ok, ms: r.ms, problems: r.problems });
      }
      await context.close();
    }));
  } finally { await browser.close(); }
  return null;
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff', '.ico': 'image/x-icon', '.wasm': 'application/wasm', '.map': 'application/json', '.txt': 'text/plain' };

/** Serves a built Storybook from `dir` on a free local port: { url, close }. */
export async function serveBuilt(dir) {
  const root = path.resolve(dir);
  const server = http.createServer((req, res) => {
    let file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
    if (file !== root && !file.startsWith(root + path.sep)) { res.statusCode = 403; return res.end(); }
    fs.stat(file, (err, stat) => {
      if (!err && stat.isDirectory()) file = path.join(file, 'index.html');
      fs.readFile(file, (e, data) => {
        if (e) { res.statusCode = 404; return res.end('Not found'); }
        res.setHeader('content-type', TYPES[path.extname(file)] ?? 'application/octet-stream');
        res.end(data);
      });
    });
  });
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  return { url: `http://127.0.0.1:${server.address().port}`, close: () => new Promise((done) => server.close(done)) };
}
