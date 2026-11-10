#!/usr/bin/env node
// Plays stories in a running Storybook, headless, and reports each one. Made
// for stage stories, whose plays drive real Quickshell sessions: each story
// gets a fresh page, is left (closing its session) before the next, and fails
// on any exception its play or render raises.
//
//   node play-stories.mjs [--url http://127.0.0.1:6030] [--workers 2] [--timeout 90000] [prefix ...]
//
// A prefix matches a story id or title ("omarchy-p5a", "Omarchy/p5a"). With no
// prefix, every story with a play runs. Needs playwright and a Chromium
// (CHROMIUM_PATH, default /usr/bin/chromium).
import { parseArgs } from 'node:util';

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    url: { type: 'string', default: process.env.STORYBOOK_URL ?? 'http://127.0.0.1:6030' },
    workers: { type: 'string', default: '2' },
    timeout: { type: 'string', default: '90000' },
    list: { type: 'boolean' },
    all: { type: 'boolean' },
  },
});

const base = values.url.replace(/\/$/, '');
const timeout = Number(values.timeout);
const index = await (await fetch(`${base}/index.json`)).json();
const stories = Object.values(index.entries)
  .filter((e) => e.type === 'story')
  .filter((e) => !positionals.length || positionals.some((p) => e.id.startsWith(p) || e.title.startsWith(p)))
  .sort((a, b) => a.id.localeCompare(b.id));
if (!stories.length) { console.error(`no stories match ${positionals.join(', ') || '(all)'}`); process.exit(2); }
if (values.list) { for (const s of stories) console.log(`${s.id}\t${s.title} / ${s.name}`); process.exit(0); }

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE ?? 'playwright');
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/usr/bin/chromium', headless: true });

function observe() {
  const run = (window.__STAGE_RUN__ = { events: [] });
  const types = ['storyFinished', 'storyRendered', 'storyThrewException', 'storyErrored', 'playFunctionThrewException', 'unhandledErrorsWhilePlaying', 'storyMissing'];
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

const failing = new Set(['storyThrewException', 'storyErrored', 'playFunctionThrewException', 'unhandledErrorsWhilePlaying', 'storyMissing']);

async function play(context, story) {
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(observe);
  const started = Date.now();
  try {
    await page.goto(`${base}/iframe.html?id=${story.id}&viewMode=story`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction((id) => {
      const ev = window.__STAGE_RUN__?.events ?? [];
      return ev.some((e) => e.type === 'storyFinished' && e.args[0]?.storyId === id)
        || ev.some((e) => ['storyThrewException', 'storyErrored', 'playFunctionThrewException', 'storyMissing'].includes(e.type));
    }, story.id, { timeout, polling: 100 });
    const events = await page.evaluate(() => window.__STAGE_RUN__.events);
    const problems = [];
    for (const e of events) {
      if (failing.has(e.type)) problems.push(`${e.type}: ${JSON.stringify(e.args).slice(0, 1500)}`);
      if (e.type === 'storyFinished' && e.args[0]?.status !== 'success') problems.push(`storyFinished ${e.args[0]?.status}`);
    }
    problems.push(...errors.map((m) => `page error: ${m}`));
    return { story, ok: problems.length === 0, problems, ms: Date.now() - started };
  } catch (e) {
    return { story, ok: false, problems: [`no result within ${timeout} ms: ${e.message.split('\n')[0]}`, ...errors], ms: Date.now() - started };
  } finally {
    // Leaving the story unmounts the stage, which ends its session.
    await page.goto('about:blank').catch(() => {});
    await page.close().catch(() => {});
  }
}

const queue = [...stories];
const results = [];
await Promise.all(Array.from({ length: Math.max(1, Number(values.workers)) }, async () => {
  const context = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  for (let s = queue.shift(); s; s = queue.shift()) {
    const r = await play(context, s);
    results.push(r);
    console.log(`${r.ok ? 'pass' : 'FAIL'}  ${s.title} / ${s.name}  (${(r.ms / 1000).toFixed(1)} s)`);
    for (const p of r.problems) console.log(`        ${p.replace(/\\n/g, '\n        ')}`);
  }
  await context.close();
}));
await browser.close();
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
process.exit(failed.length ? 1 : 0);
